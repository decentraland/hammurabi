import React, { useState } from 'react'
import { ExplorerIdentity, StoreableIdentity } from '../lib/decentraland/identity/types'
import { explorerIdentityFromEphemeralIdentity, loginAsGuest, loginUsingEthereumProvider } from '../lib/decentraland/identity/login'
import { userIdentity } from './state'

declare var ethereum: any

export const Login: React.FC = () => {
  const [storedIdentity, setStoredIdentity] = useState(getIdentityFromLocalStorage())
  const [loading, setLoading] = useState('')
  const [defaultAddress, setDefaultAddress] = useState(`default${Math.floor(Math.random() * 160) + 1}`)

  function setCurrentIdentity(indentity: ExplorerIdentity) {
    userIdentity.swap(indentity)

    console.log(`🔑 Logged in as`, indentity.address)
  }

  function signOut() {
    setStoredIdentity(null)
    localStorage.removeItem('identity')
  }

  function restore() {
    if (storedIdentity) {
      setCurrentIdentity(storedIdentity)
    }
  }

  function metamask() {
    setLoading('Please enable this page in your wallet...')
    ethereum.enable().then((address: string[]) => {
      if (Array.isArray(address) && address.length > 0 && typeof address[0] === 'string') {
        setDefaultAddress(address[0])
      }

      setLoading('Please sign the message using your wallet...')
      loginUsingEthereumProvider(ethereum).then(ephemeralIdentity => {
        saveIdentityToLocalStorage(ephemeralIdentity)
        setCurrentIdentity(
          explorerIdentityFromEphemeralIdentity(ephemeralIdentity)
        )
      })
    })
  }

  function guest() {
    setLoading('Please sign the message using your wallet...')
    loginAsGuest().then(ephemeralIdentity => {
      setCurrentIdentity(
        explorerIdentityFromEphemeralIdentity(ephemeralIdentity)
      )
    })
  }

  return (
    <div className='ui'>
      <h1>Welcome to Decentraland (Babylon.js edition)</h1>
      {loading && <div>{loading}</div>}
      <div className='panels'>
        <div className='panel-left'>
          {storedIdentity
            ? <>
              <button onClick={signOut} className='small-button danger'>Sign out</button>
              <iframe className='preview-iframe' src={`https://wearable-preview.decentraland.org/?profile=${storedIdentity.address}`} />
              <button onClick={restore} className='primary'>Continue as<br />{storedIdentity.address}</button>
              <button onClick={guest}>Guest session</button>
            </>
            : <>
              <iframe className='preview-iframe' src={`https://wearable-preview.decentraland.org/?profile=${defaultAddress}`} />
              <button onClick={metamask} className={storedIdentity ? '' : 'primary'}>Login with Ethereum</button>
              <button onClick={guest}>Guest session</button>
            </>
          }
        </div>
        <div className='panel-right'>
          <h2>Welcome to the Babylon.js Decentraland Explorer</h2>
          <p>
            This application is an alternative explorer for the Decentraland Protocol, created as part of the objectives of the&nbsp;
            <a href='https://governance.decentraland.org/proposal/?id=9303c5e0-7cbb-11ed-b135-498029192bca' target='_blank'>Protocol Squad</a>
            , funded by a DAO grant. This project is open-source and its source code can be found in the&nbsp;
            <a href='https://github.com/decentraland/hammurabi' target='_blank'>decentraland/hammurabi</a> Github repository.
          </p>
          <h2>What is Decentraland?</h2>
          <p>Decentraland is a virtual world where you can build and explore 3D creations, play games and socialize.</p>
          <p>It is a decentralized, open-source platform, controlled by its users, and powered by blockchain technology.</p>
          <h2>Supported features</h2>
          <p>
            This explorer fully implements the SDK7 of Decentraland. The best usage of this explorer is via WORLDs, since
            it will provide the performance due to the limited resources of the browser.
          </p>
          <p>
            The wearables, identity, emotes and voice chat (intergrated with the official client) are also supported.
          </p>
          <p>The full and up-to-date list of supported features is present at the <a href='https://github.com/decentraland/protocol-squad' target='_blank'>decentraland/protocol-squad</a> Github repository.</p>
        </div>
      </div>
    </div>
  )
}

function getIdentityFromLocalStorage() {
  const localStorageValue = localStorage.getItem('identity')

  if (localStorageValue === null)
    return null

  try {
    const ephemeralIdentity: StoreableIdentity = JSON.parse(localStorageValue)
    const identity = explorerIdentityFromEphemeralIdentity(ephemeralIdentity)

    return identity
  } catch (err) {
    return null
  }
}

function saveIdentityToLocalStorage(ephemeralIdentity: StoreableIdentity) {
  localStorage.setItem('identity', JSON.stringify(ephemeralIdentity))
}