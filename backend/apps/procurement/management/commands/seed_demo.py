from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.procurement.models import Approval, AuditLog, Invoice, Notification, PurchaseOrder, Quotation, RFQ, RFQItem
from apps.vendors.models import Vendor


class Command(BaseCommand):
    help = "Seed VendorBridge demo users and procurement workflow data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default="VendorBridge@123",
            help="Password assigned to all seeded demo users.",
        )

    def handle(self, *args, **options):
        password = options["password"]
        User = get_user_model()

        with transaction.atomic():
            admin = self._user(User, "admin@example.com", "admin", User.Role.ADMIN, password, is_staff=True, is_superuser=True)
            officer = self._user(User, "officer@example.com", "officer", User.Role.OFFICER, password)
            approver = self._user(User, "approver@example.com", "approver", User.Role.APPROVER, password)
            vendor_user = self._user(User, "vendor@example.com", "vendor", User.Role.VENDOR, password)

            vendor, _ = Vendor.objects.update_or_create(
                gst_number="29ABCDE1234F1Z5",
                defaults={
                    "user": vendor_user,
                    "name": "Amit Sharma",
                    "company_name": "Acme Supplies Pvt Ltd",
                    "email": "vendor@example.com",
                    "phone": "9999999999",
                    "address": "Bengaluru, Karnataka",
                    "category": Vendor.Category.GOODS,
                    "status": Vendor.Status.ACTIVE,
                    "rating": "4.50",
                    "is_deleted": False,
                },
            )

            backup_vendor, _ = Vendor.objects.update_or_create(
                gst_number="27PQRSX9876L1Z2",
                defaults={
                    "name": "Neha Rao",
                    "company_name": "Northstar Logistics",
                    "email": "northstar@example.com",
                    "phone": "8888888888",
                    "address": "Mumbai, Maharashtra",
                    "category": Vendor.Category.LOGISTICS,
                    "status": Vendor.Status.ACTIVE,
                    "rating": "4.10",
                    "is_deleted": False,
                },
            )

            rfq, created = RFQ.objects.get_or_create(
                title="Laptop Procurement for Engineering Team",
                defaults={
                    "description": "Procure laptops for the engineering team with minimum 16GB RAM and 512GB SSD.",
                    "deadline": timezone.localdate() + timedelta(days=14),
                    "created_by": officer,
                    "status": RFQ.Status.PENDING_QUOTATIONS,
                },
            )
            rfq.assigned_vendors.set([vendor, backup_vendor])
            RFQItem.objects.get_or_create(
                rfq=rfq,
                product_name="Business Laptop",
                defaults={
                    "description": "16GB RAM, 512GB SSD, 13th Gen i5 or better",
                    "quantity": 10,
                    "unit": "Units",
                },
            )

            quotation, _ = Quotation.objects.update_or_create(
                rfq=rfq,
                vendor=vendor,
                defaults={
                    "price": "500000.00",
                    "tax": "90000.00",
                    "delivery_days": 7,
                    "warranty": "1 year onsite",
                    "notes": "Ready stock, delivery within one week.",
                    "status": Quotation.Status.APPROVED,
                    "submitted_at": timezone.now(),
                },
            )

            Approval.objects.update_or_create(
                quotation=quotation,
                defaults={
                    "approver": approver,
                    "remarks": "Approved for best price and delivery timeline.",
                    "status": Approval.Status.APPROVED,
                    "reviewed_at": timezone.now(),
                },
            )

            rfq.status = RFQ.Status.APPROVED
            rfq.save(update_fields=["status", "updated_at"])

            po, _ = PurchaseOrder.objects.update_or_create(
                quotation=quotation,
                defaults={"status": PurchaseOrder.Status.INVOICED},
            )
            invoice, _ = Invoice.objects.update_or_create(
                purchase_order=po,
                defaults={
                    "invoice_date": timezone.localdate(),
                    "due_date": timezone.localdate() + timedelta(days=30),
                    "status": Invoice.Status.DRAFT,
                },
            )

            Notification.objects.get_or_create(
                user=vendor_user,
                title="Purchase Order Generated",
                message=f"Purchase order {po.po_number} has been generated for RFQ {rfq.rfq_number}.",
                notification_type="purchase_order",
            )
            AuditLog.objects.get_or_create(
                user=admin,
                action="seed_demo",
                module="System",
                object_id=invoice.id,
                summary="Demo procurement workflow seeded",
                defaults={"details": "Created demo users, vendors, RFQ, quotation, approval, PO, and invoice."},
            )

        self.stdout.write(self.style.SUCCESS("VendorBridge demo data seeded."))
        self.stdout.write("Demo users:")
        self.stdout.write(f"  admin@example.com / {password}")
        self.stdout.write(f"  officer@example.com / {password}")
        self.stdout.write(f"  approver@example.com / {password}")
        self.stdout.write(f"  vendor@example.com / {password}")

    def _user(self, User, email, username, role, password, is_staff=False, is_superuser=False):
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "role": role,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
            },
        )
        user.username = username
        user.role = role
        user.is_staff = is_staff or is_superuser
        user.is_superuser = is_superuser
        user.set_password(password)
        user.save()
        return user
