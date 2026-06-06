from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from weasyprint import HTML

from config.celery import app


@app.task
def generate_invoice_pdf(invoice_id):
    from django.core.files.base import ContentFile

    from .models import Invoice

    invoice = Invoice.objects.select_related(
        "purchase_order__quotation__vendor",
        "purchase_order__quotation__rfq",
    ).get(id=invoice_id)
    html = render_to_string("reports/invoice.html", {"invoice": invoice})
    pdf = HTML(string=html).write_pdf()
    invoice.pdf_file.save(f"{invoice.invoice_number}.pdf", ContentFile(pdf), save=True)
    return invoice.pdf_file.name


@app.task
def send_invoice_email(invoice_id):
    from .models import Invoice

    invoice = Invoice.objects.select_related("purchase_order__quotation__vendor").get(id=invoice_id)
    if not invoice.pdf_file:
        generate_invoice_pdf(invoice.id)
        invoice.refresh_from_db()
    vendor = invoice.purchase_order.quotation.vendor
    email = EmailMessage(
        subject=f"Invoice {invoice.invoice_number}",
        body=f"Please find invoice {invoice.invoice_number} attached.",
        to=[vendor.email],
    )
    invoice.pdf_file.open("rb")
    email.attach(f"{invoice.invoice_number}.pdf", invoice.pdf_file.read(), "application/pdf")
    email.send()
    invoice.status = Invoice.Status.SENT
    invoice.save(update_fields=["status", "updated_at"])
    return invoice.invoice_number
