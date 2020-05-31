import { action, computed, observable } from 'mobx';
import * as LND from 'types/generated/lnd_pb';
import Big from 'big.js';
import { getBalanceStatus } from 'util/balances';
import { percentage } from 'util/bigmath';
import { BalanceMode, BalanceModes } from 'util/constants';
import { CsvColumns } from 'util/csv';
import { ellipseInside } from 'util/strings';
import { Store } from 'store/store';

export default class Channel {
  private _store: Store;

  @observable chanId = '';
  @observable remotePubkey = '';
  @observable capacity = Big(0);
  @observable localBalance = Big(0);
  @observable remoteBalance = Big(0);
  @observable active = false;
  @observable uptime = Big(0);
  @observable lifetime = Big(0);

  constructor(store: Store, lndChannel: LND.Channel.AsObject) {
    this._store = store;
    this.update(lndChannel);
  }

  /**
   * The remotePubkey shortened to ~20 chars with ellipses inside
   */
  @computed get ellipsedPubkey() {
    return ellipseInside(this.remotePubkey);
  }

  /**
   * The uptime of the channel as a percentage of lifetime
   */
  @computed get uptimePercent(): number {
    return percentage(this.uptime, this.lifetime);
  }

  /**
   * Determines the local balance percentage of a channel based on the local and
   * remote balances
   */
  @computed get localPercent(): number {
    return percentage(this.localBalance, this.capacity);
  }

  /**
   * The order to sort this channel based on the current mode
   */
  @computed get sortOrder() {
    const mode = this._store.settingsStore.balanceMode;
    switch (mode) {
      case BalanceMode.routing:
        const pct = +this.localPercent;
        // disregard direction. the highest local percentage first
        // 99 is the highest since we use Math.floor()
        return Math.max(pct, 99 - pct);
      case BalanceMode.send:
        // the lowest local percentage first
        return 100 - this.localPercent;
      case BalanceMode.receive:
      default:
        // the highest local percentage first
        return this.localPercent;
    }
  }

  /**
   * The balance status of this channel (ok, warn, or danger)
   */
  @computed get balanceStatus() {
    const mode = this._store.settingsStore.balanceMode;
    return getBalanceStatus(this.localBalance, this.capacity, BalanceModes[mode]);
  }

  /**
   * Updates this channel model using data provided from the LND GRPC api
   * @param lndChannel the channel data
   */
  @action.bound
  update(lndChannel: LND.Channel.AsObject) {
    this.chanId = lndChannel.chanId;
    this.remotePubkey = lndChannel.remotePubkey;
    this.capacity = Big(lndChannel.capacity);
    this.localBalance = Big(lndChannel.localBalance);
    this.remoteBalance = Big(lndChannel.remoteBalance);
    this.active = lndChannel.active;
    this.uptime = Big(lndChannel.uptime);
    this.lifetime = Big(lndChannel.lifetime);
  }

  /**
   * Specifies which properties of this class should be exported to CSV
   * @param key must match the name of a property on this class
   * @param value the user-friendly name displayed in the CSV header
   */
  static csvColumns: CsvColumns = {
    chanId: 'Channel ID',
    remotePubkey: 'Remote Pubkey',
    capacity: 'Capacity',
    localBalance: 'Local Balance',
    remoteBalance: 'Remote Balance',
    active: 'Active',
    uptimePercent: 'Uptime Percent',
  };
}
