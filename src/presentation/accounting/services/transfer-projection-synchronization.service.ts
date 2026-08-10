import { Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';

import { Guid } from 'typescript-guid';

const synchronizationTimeoutMs = 30_000;

@Injectable()
export class TransferProjectionSynchronizationService implements OnDestroy {
	private readonly synchronizingOperationKeysByAccountSignal = signal<ReadonlyMap<string, ReadonlySet<string>>>(
		new Map()
	);
	private readonly delayedOperationKeysByAccountSignal = signal<ReadonlyMap<string, ReadonlySet<string>>>(new Map());
	private readonly synchronizationTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

	public start(accountIds: readonly Guid[], operationKey: Guid): void {
		for (const accountId of accountIds) {
			const normalizedAccountId = accountId.toString();
			const normalizedOperationKey = operationKey.toString();
			const synchronizationKey = this.toSynchronizationKey(normalizedAccountId, normalizedOperationKey);

			this.cancelTimeout(synchronizationKey);
			this.updateOperationKeys(
				this.synchronizingOperationKeysByAccountSignal,
				normalizedAccountId,
				operationKeys => {
					operationKeys.add(normalizedOperationKey);
				}
			);
			this.updateOperationKeys(this.delayedOperationKeysByAccountSignal, normalizedAccountId, operationKeys => {
				operationKeys.delete(normalizedOperationKey);
			});
			this.synchronizationTimeouts.set(
				synchronizationKey,
				setTimeout(
					() => this.markAsDelayed(normalizedAccountId, normalizedOperationKey),
					synchronizationTimeoutMs
				)
			);
		}
	}

	public completeProjectedOperations(accountId: Guid | string, operationKeys: readonly Guid[]): void {
		const normalizedAccountId = accountId.toString();

		for (const operationKey of operationKeys) {
			const normalizedOperationKey = operationKey.toString();
			const synchronizationKey = this.toSynchronizationKey(normalizedAccountId, normalizedOperationKey);

			this.cancelTimeout(synchronizationKey);
			this.updateOperationKeys(
				this.synchronizingOperationKeysByAccountSignal,
				normalizedAccountId,
				pendingOperationKeys => {
					pendingOperationKeys.delete(normalizedOperationKey);
				}
			);
			this.updateOperationKeys(
				this.delayedOperationKeysByAccountSignal,
				normalizedAccountId,
				delayedOperationKeys => {
					delayedOperationKeys.delete(normalizedOperationKey);
				}
			);
		}
	}

	public isSynchronizing(accountId: Guid | string | undefined): boolean {
		return !!accountId && this.hasOperationKeys(this.synchronizingOperationKeysByAccountSignal(), accountId);
	}

	public isDelayed(accountId: Guid | string | undefined): boolean {
		return !!accountId && this.hasOperationKeys(this.delayedOperationKeysByAccountSignal(), accountId);
	}

	public ngOnDestroy(): void {
		for (const timeout of this.synchronizationTimeouts.values()) {
			globalThis.clearTimeout(timeout);
		}

		this.synchronizationTimeouts.clear();
	}

	private markAsDelayed(accountId: string, operationKey: string): void {
		const synchronizationKey = this.toSynchronizationKey(accountId, operationKey);

		this.synchronizationTimeouts.delete(synchronizationKey);
		this.updateOperationKeys(this.synchronizingOperationKeysByAccountSignal, accountId, operationKeys => {
			operationKeys.delete(operationKey);
		});
		this.updateOperationKeys(this.delayedOperationKeysByAccountSignal, accountId, operationKeys => {
			operationKeys.add(operationKey);
		});
	}

	private cancelTimeout(synchronizationKey: string): void {
		const timeout = this.synchronizationTimeouts.get(synchronizationKey);

		if (timeout) {
			globalThis.clearTimeout(timeout);
			this.synchronizationTimeouts.delete(synchronizationKey);
		}
	}

	private updateOperationKeys(
		operationKeysByAccountSignal: WritableSignal<ReadonlyMap<string, ReadonlySet<string>>>,
		accountId: string,
		update: (operationKeys: Set<string>) => void
	): void {
		const operationKeysByAccount = new Map(operationKeysByAccountSignal());
		const operationKeys = new Set(operationKeysByAccount.get(accountId));

		update(operationKeys);

		if (operationKeys.size === 0) {
			operationKeysByAccount.delete(accountId);
		} else {
			operationKeysByAccount.set(accountId, operationKeys);
		}

		operationKeysByAccountSignal.set(operationKeysByAccount);
	}

	private hasOperationKeys(
		operationKeysByAccount: ReadonlyMap<string, ReadonlySet<string>>,
		accountId: Guid | string
	): boolean {
		return (operationKeysByAccount.get(accountId.toString())?.size ?? 0) > 0;
	}

	private toSynchronizationKey(accountId: string, operationKey: string): string {
		return `${accountId}:${operationKey}`;
	}
}
