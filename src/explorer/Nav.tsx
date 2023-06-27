import React, { useEffect, useState } from 'react'
import { useAtom } from '../lib/misc/atom'
import { currentRealm, selectedInputVoiceDevice } from './state'
import { connectRealm } from '../lib/decentraland/communications/realm-communications-system'
import { publishedWorlds } from './published-worlds'

const suggestedRealms = [
  "https://sdk-team-cdn.decentraland.org/ipfs/goerli-plaza-main",
  "/ipfs/testing-realm",
]

export const VoiceHandler: React.FC = () => {
  const inputDevice = useAtom(selectedInputVoiceDevice)
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])

  function joinVoicechat() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          setMicrophones(devices.filter($ => $.kind === 'audioinput'))
        })
        .catch((err) => {
          console.error(err)
        })
    })
  }

  if (!inputDevice && !microphones.length) {
    return (
      <div className='voicechat'>
        <button onClick={joinVoicechat}>Join Voicechat</button>
      </div>
    )
  }

  return (
    <div className='voicechat'>
      <select id="microphone" aria-placeholder="Select a microphone" value={inputDevice ?? undefined} onChange={(event) => {
        selectedInputVoiceDevice.swap(event.currentTarget.value)
      }} disabled={!!inputDevice}>
        <option disabled>Select a microphone</option>
        {microphones.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
      </select>
    </div>
  )

}

export const NavBar: React.FC = () => {
  const realm = useAtom(currentRealm)
  const [loading, setLoading] = useState(false)
  const [currentValue, setCurrentValue] = useState('')
  const [hasFocus, setHasFocus] = useState(false)
  const [selectedElement, setSelectedElement] = useState(0)
  const [searchElements, setSearchElements] = useState<string[]>([])

  function filter() {
    const elements = getElements(20, currentValue)
    setSelectedElement(-1)
    setSearchElements(elements)
  }

  function setRealm(connString: string) {
    setLoading(true)
    document.getElementById('renderCanvas')?.focus()
    connectRealm(currentRealm, connString)
      .then((newRealm) => {
        const q = new URLSearchParams(globalThis.location.search)
        q.set('realm', newRealm.connectionString)

        globalThis.history.replaceState({ realm: newRealm.connectionString }, 'realm', `?${q.toString()}`)

        setLoading(false)
        setCurrentValue(newRealm.connectionString)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        setCurrentValue(realm?.connectionString || currentValue)
      })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()

      if (selectedElement >= 0 && selectedElement < searchElements.length) {
        setRealm(searchElements[selectedElement])
        event.currentTarget.value = searchElements[selectedElement] || currentValue
      } else {
        setRealm(event.currentTarget.value)
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectNext()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectPrev()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      filter()
      document.getElementById('renderCanvas')?.focus()
      event.currentTarget.value = realm?.connectionString || currentValue
    } else {
      filter()
    }
  }

  function selectNext() {
    setSelectedElement((selectedElement + 1) % searchElements.length)
  }

  function selectPrev() {
    setSelectedElement((selectedElement - 1 + searchElements.length) % searchElements.length)
  }

  useEffect(() => {
    filter()
  }, [currentValue])

  useEffect(() => {
    const url = new URLSearchParams(location.search)
    if (url.has('realm')) {
      setRealm(url.get('realm')!)
    }
  }, [])

  return <>
    <nav>
      <input
        id="realm-input"
        disabled={loading}
        type="text"
        placeholder="Realm URL"
        autoComplete='off'
        value={currentValue}
        onKeyDown={handleKeyDown}
        onChange={
          (event) => {
            setCurrentValue(event.currentTarget.value)
            filter()
          }
        }
        onFocus={(e) => {
          setHasFocus(true)
          e.currentTarget.selectionDirection = 'forward'
          e.currentTarget.selectionStart = 0
          e.currentTarget.selectionEnd = e.target.value.length
          e.currentTarget.select()
          setSelectedElement(-1)
        }}
        onBlur={() => {
          setHasFocus(false)
        }}
      />
      <VoiceHandler />
      {
        hasFocus &&
        <div className='realm-browser'>
          {searchElements.map(($, ix) =>
            ix === selectedElement
              ? <div key={$} className='selected' onMouseOver={() => { setSelectedElement(ix) }} onMouseDown={() => setRealm($)}>{$}</div>
              : <div key={$} onMouseOver={() => { setSelectedElement(ix) }}>{$}</div>
          )}
        </div>
      }
    </nav>
  </>
}

function getElements(count: number, needle: string) {
  const ret: string[] = []

  if (ret.length < count)
    for (const realm of suggestedRealms) {
      if (fuzzysearch(needle, realm)) {
        ret.push(realm)
        if (ret.length == count) break
      }
    }

  if (ret.length < count)
    for (const realm of publishedWorlds) {
      if (fuzzysearch(needle, realm)) {
        ret.push(realm)
        if (ret.length == count) break
      }
    }

  return ret
}

function fuzzysearch(needle: string, haystack: string) {
  const hlen = haystack.length
  const nlen = needle.length
  if (nlen > hlen) {
    return false
  }
  if (nlen === hlen) {
    return needle === haystack
  }
  outer: for (var i = 0, j = 0; i < nlen; i++) {
    var nch = needle.charCodeAt(i)
    while (j < hlen) {
      if (haystack.charCodeAt(j++) === nch) {
        continue outer
      }
    }
    return false
  }
  return true
}