import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

import { PendingPaymentCommand } from '../models/pending-payment-command';

const registryStorageKey = 'home-ledger.payment-commands.pending.v1';
const registryVersion = 1;
const pendingCommandTtlMs = 60 * 60 * 1_000;

@Injectable()
export class PendingPaymentCommandRegistryService {
	private readonly document = inject(DOCUMENT);

	public save(command: PendingPaymentCommand, now: Date = new Date()): void {
		const existingCommands = this.getAll(now);
		const existingCommand = existingCommands.find(existing => existing.intentId === command.intentId);
		const commands = existingCommands.filter(existing => existing.intentId !== command.intentId);
		commands.push({ ...command, createdAt: existingCommand?.createdAt ?? command.createdAt });
		this.write(commands);
	}

	public updateCommandId(
		intentId: string,
		commandId: string,
		operationId: string | undefined,
		now: Date = new Date()
	): void {
		const commands = this.getAll(now).map(command =>
			command.intentId === intentId
				? {
						...command,
						commandId,
						operationId: operationId ?? command.operationId,
						updatedAt: now.toISOString(),
					}
				: command
		);
		this.write(commands);
	}

	public getAll(now: Date = new Date()): PendingPaymentCommand[] {
		const commands = this.read();
		const recoverableCommands = commands.filter(command => !this.isExpired(command, now));
		if (recoverableCommands.length !== commands.length) {
			this.write(recoverableCommands);
		}
		return recoverableCommands;
	}

	public clearExpired(now: Date = new Date()): void {
		this.getAll(now);
	}

	public remove(intentId: string, now: Date = new Date()): void {
		this.write(this.getAll(now).filter(command => command.intentId !== intentId));
	}

	public clear(): void {
		try {
			this.storage()?.removeItem(registryStorageKey);
		} catch {
			// Browser storage can be unavailable or blocked; recovery remains best-effort.
		}
	}

	private read(): PendingPaymentCommand[] {
		try {
			const rawValue = this.storage()?.getItem(registryStorageKey);
			if (!rawValue) {
				return [];
			}
			const parsedValue: unknown = JSON.parse(rawValue);
			if (!Array.isArray(parsedValue)) {
				this.clear();
				return [];
			}
			const validCommands = parsedValue.filter(value => this.isValid(value));
			if (validCommands.length !== parsedValue.length) {
				this.write(validCommands);
			}
			return validCommands;
		} catch {
			this.clear();
			return [];
		}
	}

	private write(commands: readonly PendingPaymentCommand[]): void {
		try {
			const storage = this.storage();
			if (!storage) {
				return;
			}
			if (commands.length === 0) {
				storage.removeItem(registryStorageKey);
				return;
			}
			storage.setItem(registryStorageKey, JSON.stringify(commands));
		} catch {
			// Browser storage can be unavailable or full; command execution remains available for this route lifetime.
		}
	}

	private storage(): Storage | undefined {
		return this.document.defaultView?.sessionStorage;
	}

	private isExpired(command: PendingPaymentCommand, now: Date): boolean {
		const createdAt = Date.parse(command.createdAt);
		return !Number.isFinite(createdAt) || now.getTime() - createdAt > pendingCommandTtlMs;
	}

	private isValid(value: unknown): value is PendingPaymentCommand {
		if (!this.isRecord(value) || value.version !== registryVersion || !this.isAction(value.action)) {
			return false;
		}
		if (!this.hasText(value.intentId) || !this.hasText(value.accountId) || !this.hasText(value.idempotencyKey)) {
			return false;
		}
		if (!this.isDate(value.createdAt) || !this.isDate(value.updatedAt)) {
			return false;
		}
		if (value.commandId !== undefined && !this.hasText(value.commandId)) {
			return false;
		}
		if (value.action === 'delete') {
			return this.hasText(value.operationId);
		}
		return (
			this.isReplayableRequest(value.request) && (value.action !== 'update' || this.hasText(value.operationId))
		);
	}

	private isReplayableRequest(value: unknown): boolean {
		return (
			this.isRecord(value) &&
			Number.isFinite(value.amount) &&
			typeof value.operationType === 'number' &&
			this.hasText(value.categoryId) &&
			this.hasText(value.comment) &&
			this.hasText(value.contractorId) &&
			this.isDate(value.operationDate) &&
			this.hasText(value.operationId)
		);
	}

	private isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	private isAction(value: unknown): value is PendingPaymentCommand['action'] {
		return value === 'create' || value === 'update' || value === 'delete';
	}

	private hasText(value: unknown): value is string {
		return typeof value === 'string' && value.length > 0;
	}

	private isDate(value: unknown): value is string {
		return this.hasText(value) && Number.isFinite(Date.parse(value));
	}
}
