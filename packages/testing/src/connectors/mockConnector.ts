import { getAddress } from 'ethers/lib/utils'
import {
  Chain,
  Connector,
  defaultChains,
  normalizeChainId,
} from 'wagmi-private'

import { wallets } from '../constants'
import { MockProvider, MockProviderOptions } from './mockProvider'

export class MockConnector extends Connector<
  MockProvider,
  MockProviderOptions
> {
  readonly id = 'mock'
  readonly name = 'Mock'
  readonly ready = true

  private _provider: MockProvider

  constructor(
    config: { chains: Chain[]; options: MockProviderOptions } = {
      chains: defaultChains,
      options: {
        network: 1,
        privateKey: wallets.ethers1.privateKey,
      },
    },
  ) {
    super(config)
    this._provider = new MockProvider(config.options)
  }

  get provider() {
    return this._provider
  }

  async connect() {
    const provider = this.provider
    provider.on('accountsChanged', this.onAccountsChanged)
    provider.on('chainChanged', this.onChainChanged)
    provider.on('disconnect', this.onDisconnect)

    const accounts = await provider.enable()
    const account = getAddress(accounts[0])
    const chainId = normalizeChainId(provider._network.chainId)
    const data = { account, chainId, provider }
    return data
  }

  async disconnect() {
    const provider = this.provider
    await provider.disconnect()

    provider.removeListener('accountsChanged', this.onAccountsChanged)
    provider.removeListener('chainChanged', this.onChainChanged)
    provider.removeListener('disconnect', this.onDisconnect)
  }

  async getAccount() {
    const provider = this.provider
    const accounts = await provider.getAccounts()
    const account = accounts[0]
    if (!account) throw new Error('Failed to get account')
    // return checksum address
    return getAddress(account)
  }

  async getChainId() {
    const provider = this.provider
    const chainId = normalizeChainId(provider.network.chainId)
    return chainId
  }

  async getSigner() {
    const provider = this.provider
    const signer = provider.getSigner()
    return signer
  }

  async isAuthorized() {
    try {
      const provider = this.provider
      const account = await provider.getAccounts()
      return !!account
    } catch {
      return false
    }
  }

  async switchChain(chainId: number) {
    const provider = this.provider
    await provider.switchChain(chainId)
  }

  async watchAsset(asset: {
    address: string
    decimals?: number
    image?: string
    symbol: string
  }) {
    const provider = this.provider
    await provider.watchAsset(asset)
  }

  protected onAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) this.emit('disconnect')
    else this.emit('change', { account: accounts[0] })
  }

  protected onChainChanged = (chainId: number | string) => {
    this.emit('change', { chainId: normalizeChainId(chainId) })
  }

  protected onDisconnect = () => {
    this.emit('disconnect')
  }
}
