import React from 'react'
import { createRoot } from 'react-dom/client';
import { Renderer } from './Renderer'
import { useAtom } from '../lib/misc/atom'
import { currentRealm, loadingState, realmErrors, userDidInteract, userIdentity } from './state'
import { NavBar } from './Nav'
import { Login } from './Login';
import { EmptyState } from './EmptyState';

const RealmErrors: React.FC = () => {
  const errors = useAtom(realmErrors)

  return (
    <>
      {
        errors?.length &&
        <div className='errors'>
          {errors.map((error, index) => (
            <div key={index} className='error'>
              {error}
            </div>
          ))}
        </div>
      }
    </>
  )
}

const App: React.FC = () => {
  const didInteract = useAtom(userDidInteract)
  const identity = useAtom(userIdentity)
  const realm = useAtom(currentRealm)
  const sceneLoadingState = useAtom(loadingState)

  return (
    <>
      {identity
        ?
        <>
          <NavBar />
          <div id="mainContent" style={{ display: identity ? 'block' : 'none' }} >
            {sceneLoadingState?.pending ? <LoadingScreen {...sceneLoadingState} /> : null}
            {didInteract && <Renderer visible={!!identity} />}
            {!realm ? <EmptyState /> : null}
          </div >
        </>
        :
        <Login />
      }
      <RealmErrors />
    </>
  )
}


const LoadingScreen: React.FC<{ total: number, pending: number }> = ({ total, pending }) => {
  return <div id="loading">
    Loading scenes: {total - pending}/{total}
    <br />
    <progress value={total - pending} max={total} />
  </div>
}

export function renderApp() {
  createRoot(document.getElementById('root')!).render(<App />)
}
