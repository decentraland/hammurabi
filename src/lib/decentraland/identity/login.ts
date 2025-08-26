import { computeAddress, createUnsafeIdentity } from '@dcl/crypto/dist/crypto'
import * as secp256k1 from "ethereum-cryptography/secp256k1"
import { hexToBytes, bytesToHex, RequestManager } from 'eth-connect'
import { StoreableIdentity, ExplorerIdentity } from './types'
import { Authenticator, IdentityType } from '@dcl/crypto'

const ephemeralLifespanMinutes = 10_000

// this function creates a Decentraland AuthChain using an unsafe in-memory ephemeral
// private key
export async function loginAsGuest(): Promise<StoreableIdentity> {
  // real account
  const account = createUnsafeIdentity()

  async function signer(message: string): Promise<string> {
    return Authenticator.createSignature(account, message)
  }

  return identityFromSigner(account.address, signer, true)
}

// this function creates a signer (ExplorerIdentity) based on a ephemeral identity
export function explorerIdentityFromEphemeralIdentity(storeIdentity: StoreableIdentity): ExplorerIdentity {
  const ephemeralPrivateKey = hexToBytes(storeIdentity.ephemeralIdentity.privateKey)

  // remove heading 0x04
  const publicKey = secp256k1.getPublicKey(ephemeralPrivateKey).slice(1)
  const ephemeralAddress = computeAddress(publicKey)

  const account: IdentityType = {
    privateKey: bytesToHex(ephemeralPrivateKey),
    publicKey: bytesToHex(publicKey),
    address: ephemeralAddress
  }

  if (account.address.toLowerCase() !== storeIdentity.ephemeralIdentity.address.toLowerCase())
    throw new Error('Invalid ephemeral identity (address)')

  if (account.publicKey.toLowerCase() !== storeIdentity.ephemeralIdentity.publicKey.toLowerCase())
    throw new Error('Invalid ephemeral identity (publicKey)')

  if (storeIdentity.authChain[0].type !== 'SIGNER') throw new Error('Invalid auth chain, must block should be a signer')
  const signerAddress = storeIdentity.authChain[0].payload

  // TODO: check whether the authChain corresponds to this ephemeral key

  async function signer(message: string): Promise<string> {
    return Authenticator.createSignature(account, message)
  }

  return {
    address: signerAddress,
    signer,
    authChain: storeIdentity,
    isGuest: storeIdentity.isGuest
  }
}

// this function creates a Decentraland AuthChain using a provider (like metamask)
export async function loginUsingEthereumProvider(provider: any): Promise<StoreableIdentity> {
  const requestManager = new RequestManager(provider)

  const address = await getEthereumUserAccount(requestManager, false)

  if (!address) throw new Error("Couldn't get an address from the Ethereum provider")

  async function signer(message: string): Promise<string> {
    while (true) {
      const result = await requestManager.personal_sign(message, address!, '')
      if (!result) continue
      return result
    }
  }

  return identityFromSigner(address, signer, false)
}

// this function creates a Decentraland AuthChain using a signer function.
// the signer function is only used once, to sign the ephemeral private key. after that,
// the ephemeral private key is used to sign the rest of the authChain and subsequent
// messages. this is a good way to not over-expose the real user accounts to excessive
// signing requests.
async function identityFromSigner(address: string, signer: (message: string) => Promise<string>, isGuest: boolean): Promise<StoreableIdentity> {
  const ephemeral = createUnsafeIdentity()

  const authChain = await Authenticator.initializeAuthChain(address, ephemeral, ephemeralLifespanMinutes, signer)

  return {
    ...authChain,
    isGuest
  }
}

export async function createGuestIdentity(): Promise<ExplorerIdentity> {
  const storeableIdentity = await loginAsGuest()
  return explorerIdentityFromEphemeralIdentity(storeableIdentity)
}

export async function getEthereumUserAccount(requestManager: RequestManager, returnChecksum: boolean): Promise<string | undefined> {
  try {
    const accounts = await requestManager.eth_accounts()

    if (!accounts || accounts.length === 0) {
      return undefined
    }

    return returnChecksum ? accounts[0] : accounts[0].toLowerCase()
  } catch (error: any) {
    throw new Error(`Could not access eth_accounts: "${error.message}"`)
  }
}
