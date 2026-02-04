import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ExpandableTextComponent } from '../../../shared/components/expandable-text/expandable-text.component';
import { ClipboardItem, PaymentClipboardItem } from '../../../shared/models/clipboard-item';
import { BaseClipboardComponent } from '../base-clipboard';
import { BitcoinAmountComponent } from '../../../shared/components/bitcoin-amount/bitcoin-amount.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { lastValueFrom } from 'rxjs';
import { ServerService } from '../../../shared/services/server.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-clipboard-details',
    imports: [CommonModule, MatButtonModule, ExpandableTextComponent, BitcoinAmountComponent, MatIconModule, MatTooltipModule],
    templateUrl: './clipboard-details.component.html',
    styleUrl: './clipboard-details.component.scss'
})
export class ClipboardDetailsComponent extends BaseClipboardComponent {
    @Input() clipboardItem: ClipboardItem | null;
    @Output() clipboardItemChange = new EventEmitter<ClipboardItem>();

    verifyTooltip = "Verify clipboard content against Branta's server.";

    constructor(private serverService: ServerService, private toastrService: ToastrService) {
        super();
    }

    onVerify(): void {
        (async () => {
            const value = this.clipboardItem?.value;

            if (!value) {
                return;
            }

            const result = await this.queryPayments(value);

            if (result) {
                this.clipboardItemChange.emit(result as PaymentClipboardItem);
                return;
            }

            this.showPaymentNotFoundToast(value);
        })();
    }

    private showPaymentNotFoundToast(value: string): void {
        this.toastrService.error(
            `For more info on why this payment was not found click <a href="#" class="payment-link">here</a>.`,
            'Payment not found',
            {
                enableHtml: true,
                tapToDismiss: false
            }
        );

        setTimeout(() => {
            const link = document.querySelector('.toast-error .payment-link');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = `${this.serverService.baseUrl}/v2/verify/${encodeURIComponent(value)}`;
                    window.electron.openUrl(url);
                });
            }
        }, 100);
    }

    private async queryPayments(value: string): Promise<PaymentClipboardItem | null> {
        try {
            const paymentClipboardItems = await lastValueFrom(this.serverService.getPayment(value));

            const paymentClipboardItem = paymentClipboardItems[0];

            paymentClipboardItem.name = paymentClipboardItem.platform;
            paymentClipboardItem.value = value;

            return paymentClipboardItem;
        } catch (error) {
            return null;
        }
    }
}
