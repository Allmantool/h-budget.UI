import { Injectable, OnDestroy, signal } from '@angular/core';

import { Guid } from 'typescript-guid';

export const RECENT_PAYMENT_MUTATION_DURATION_MS = 2_000;

export type PaymentEditorMode = 'create' | 'edit';
export type RecentPaymentMutationKind = 'created' | 'updated';

export interface RecentPaymentMutation {
	kind: RecentPaymentMutationKind;
	operationId: Guid;
}

@Injectable()
export class PaymentEditorSessionService implements OnDestroy {
	private readonly pendingRecentMutationSignal = signal<RecentPaymentMutation | undefined>(undefined);
	private recentMutationTimeout?: ReturnType<typeof setTimeout>;

	public readonly editorModeSignal = signal<PaymentEditorMode>('create');
	public readonly recentMutationSignal = signal<RecentPaymentMutation | undefined>(undefined);

	public beginCreate(): void {
		this.editorModeSignal.set('create');
	}

	public beginEdit(): void {
		this.editorModeSignal.set('edit');
	}

	public reset(): void {
		this.beginCreate();
		this.clearRecentMutation();
	}

	public queueRecentMutation(operationId: Guid, kind: RecentPaymentMutationKind): void {
		this.clearRecentMutation();
		this.pendingRecentMutationSignal.set({ operationId, kind });
	}

	public confirmRecentMutationIsVisible(operationIds: readonly Guid[]): void {
		const pendingMutation = this.pendingRecentMutationSignal();
		if (!pendingMutation || !operationIds.some(operationId => operationId.equals(pendingMutation.operationId))) {
			return;
		}

		this.pendingRecentMutationSignal.set(undefined);
		this.recentMutationSignal.set(pendingMutation);
		this.recentMutationTimeout = globalThis.setTimeout(
			() => this.clearRecentMutation(),
			RECENT_PAYMENT_MUTATION_DURATION_MS
		);
	}

	public clearRecentMutation(): void {
		if (this.recentMutationTimeout) {
			globalThis.clearTimeout(this.recentMutationTimeout);
			this.recentMutationTimeout = undefined;
		}

		this.pendingRecentMutationSignal.set(undefined);
		this.recentMutationSignal.set(undefined);
	}

	public ngOnDestroy(): void {
		this.clearRecentMutation();
	}
}
