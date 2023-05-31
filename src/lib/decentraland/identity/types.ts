import { AuthIdentity } from "@dcl/crypto"

export type ExplorerIdentity = {
  // public address of the first elemement of the authChain
  address: string
  // is the address an ephemeral address? used to determine if the user is a guest
  isGuest: boolean
  // the authChain is the chain of signatures that prove the ownership of the address
  authChain: AuthIdentity
  // the signer function will be used to sign messages using the last element of the authChain
  signer: (message: string) => Promise<string>
}

export type StoreableIdentity = AuthIdentity & {
  // is the address an ephemeral address? used to determine if the user is a guest
  isGuest: boolean
}