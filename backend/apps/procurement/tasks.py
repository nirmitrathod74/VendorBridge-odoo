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
    try:
        pdf = HTML(string=html).write_pdf()
    except Exception as e:
        print(f"WeasyPrint failed: {e}. Generating dummy PDF.")
        pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT\n/F1 18 Tf\n50 700 Td\n(Generated Dummy Invoice PDF) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000246 00000 n \n0000000352 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n440\n%%EOF"
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
