import { Injectable, OnDestroy, signal } from '@angular/core';

import { Guid } from 'typescript-guid';

const synchronizationTimeoutMs = 30_000;

@Injectable()
export class TransferProjectionSynchronizationService implements OnDestroy {
	private readonly synchronizingAccountIdsSignal = signal<ReadonlySet<string>>(new Set());
	private readonly delayedAccountIdsSignal = signal<ReadonlySet<string>>(new Set());
	private readonly synchronizationTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

	public start(accountIds: readonly Guid[]): void {
		for (const accountId of accountIds) {
			const normalizedAccountId = accountId.toString();

			this.cancelTimeout(normalizedAccountId);
			this.updateSynchronizingAccounts(accountIds => {
				accountIds.add(normalizedAccountId);
				return true;
			});
			this.updateDelayedAccounts(accountIds => accountIds.delete(normalizedAccountId));
			this.synchronizationTimeouts.set(
				normalizedAccountId,
				setTimeout(() => this.markAsDelayed(normalizedAccountId), synchronizationTimeoutMs)
			);
		}
	}

	public complete(accountId: Guid | string): void {
		const normalizedAccountId = accountId.toString();

		this.cancelTimeout(normalizedAccountId);
		this.updateSynchronizingAccounts(accountIds => accountIds.delete(normalizedAccountId));
		this.updateDelayedAccounts(accountIds => accountIds.delete(normalizedAccountId));
	}

	public isSynchronizing(accountId: Guid | string | undefined): boolean {
		return !!accountId && this.synchronizingAccountIdsSignal().has(accountId.toString());
	}

	public isDelayed(accountId: Guid | string | undefined): boolean {
		return !!accountId && this.delayedAccountIdsSignal().has(accountId.toString());
	}

	public ngOnDestroy(): void {
		for (const timeout of this.synchronizationTimeouts.values()) {
			globalThis.clearTimeout(timeout);
		}

		this.synchronizationTimeouts.clear();
	}

	private markAsDelayed(accountId: string): void {
		this.synchronizationTimeouts.delete(accountId);
		this.updateSynchronizingAccounts(accountIds => accountIds.delete(accountId));
		this.updateDelayedAccounts(accountIds => {
			accountIds.add(accountId);
			return true;
		});
	}

	private cancelTimeout(accountId: string): void {
		const timeout = this.synchronizationTimeouts.get(accountId);

		if (timeout) {
			globalThis.clearTimeout(timeout);
			this.synchronizationTimeouts.delete(accountId);
		}
	}

	private updateSynchronizingAccounts(update: (accountIds: Set<string>) => boolean): void {
		const accountIds = new Set(this.synchronizingAccountIdsSignal());

		if (update(accountIds)) {
			this.synchronizingAccountIdsSignal.set(accountIds);
		}
	}

	private updateDelayedAccounts(update: (accountIds: Set<string>) => boolean): void {
		const accountIds = new Set(this.delayedAccountIdsSignal());

		if (update(accountIds)) {
			this.delayedAccountIdsSignal.set(accountIds);
		}
	}
}
