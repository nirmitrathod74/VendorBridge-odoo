from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.procurement.models import Approval, AuditLog, Invoice, Notification, PurchaseOrder, Quotation, RFQ, RFQItem
from apps.vendors.models import Vendor


class Command(BaseCommand):
    help = "Seed VendorBridge demo users and a rich procurement workflow dataset."

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
            users = self._seed_users(User, password)
            vendors = self._seed_vendors(users)
            rfqs = self._seed_rfqs(users["officer"], vendors)
            self._seed_quotations_and_workflows(users, vendors, rfqs)
            self._seed_activity(users, rfqs)

        cache.clear()
        self.stdout.write(self.style.SUCCESS("VendorBridge rich demo data seeded."))
        self.stdout.write("Demo users:")
        for email in [
            "admin@example.com",
            "officer@example.com",
            "officer2@example.com",
            "approver@example.com",
            "approver2@example.com",
            "vendor@example.com",
            "vendor2@example.com",
            "vendor3@example.com",
        ]:
            self.stdout.write(f"  {email} / {password}")

    def _seed_users(self, User, password):
        return {
            "admin": self._user(User, "admin@example.com", "admin", User.Role.ADMIN, password, "System", "Admin", is_staff=True, is_superuser=True),
            "officer": self._user(User, "officer@example.com", "officer", User.Role.OFFICER, password, "Riya", "Procurement"),
            "officer2": self._user(User, "officer2@example.com", "officer2", User.Role.OFFICER, password, "Karan", "Sourcing"),
            "approver": self._user(User, "approver@example.com", "approver", User.Role.APPROVER, password, "Meera", "Manager"),
            "approver2": self._user(User, "approver2@example.com", "approver2", User.Role.APPROVER, password, "Arjun", "Director"),
            "vendor_user": self._user(User, "vendor@example.com", "vendor", User.Role.VENDOR, password, "Amit", "Vendor"),
            "vendor_user2": self._user(User, "vendor2@example.com", "vendor2", User.Role.VENDOR, password, "Neha", "Vendor"),
            "vendor_user3": self._user(User, "vendor3@example.com", "vendor3", User.Role.VENDOR, password, "Farhan", "Vendor"),
        }

    def _seed_vendors(self, users):
        vendor_specs = [
            ("29ABCDE1234F1Z5", users["vendor_user"], "Amit Sharma", "Infra Supplies Pvt Ltd", "vendor@example.com", "9999999999", "Bengaluru, Karnataka", Vendor.Category.GOODS, Vendor.Status.ACTIVE, "4.50"),
            ("27PQRSX9876L1Z2", users["vendor_user2"], "Neha Rao", "TechCore ITD", "vendor2@example.com", "8888888888", "Mumbai, Maharashtra", Vendor.Category.TECHNOLOGY, Vendor.Status.ACTIVE, "4.20"),
            ("24ZXCVB6789Q1Z1", users["vendor_user3"], "Farhan Khan", "Office Needs Co.", "vendor3@example.com", "7777777777", "Ahmedabad, Gujarat", Vendor.Category.GOODS, Vendor.Status.ACTIVE, "3.80"),
            ("07LMNOP4567R1Z9", None, "Pooja Iyer", "Northstar Logistics", "northstar@example.com", "9811111111", "Delhi NCR", Vendor.Category.LOGISTICS, Vendor.Status.ACTIVE, "4.10"),
            ("19HJKLO7788A1Z3", None, "Sanjay Patel", "Prime Facility Services", "primefacilities@example.com", "9822222222", "Pune, Maharashtra", Vendor.Category.MAINTENANCE, Vendor.Status.ACTIVE, "4.35"),
            ("33QWERT9988P1Z4", None, "Devika Nair", "CloudNest Solutions", "cloudnest@example.com", "9833333333", "Kochi, Kerala", Vendor.Category.TECHNOLOGY, Vendor.Status.ACTIVE, "4.75"),
            ("06ASDFG1122K1Z8", None, "Manish Gupta", "GreenPack Materials", "greenpack@example.com", "9844444444", "Jaipur, Rajasthan", Vendor.Category.GOODS, Vendor.Status.ACTIVE, "3.95"),
            ("36BNMJK4455H1Z7", None, "Sara Thomas", "SwiftRoute Freight", "swiftroute@example.com", "9855555555", "Hyderabad, Telangana", Vendor.Category.LOGISTICS, Vendor.Status.INACTIVE, "3.30"),
            ("22TYUIO3344D1Z2", None, "Kavita Shah", "Metro Print Works", "metroprint@example.com", "9866666666", "Surat, Gujarat", Vendor.Category.SERVICES, Vendor.Status.ACTIVE, "4.05"),
            ("10GHJKL5566N1Z6", None, "Rohit Singh", "Legacy Hardware Traders", "legacyhardware@example.com", "9877777777", "Patna, Bihar", Vendor.Category.OTHER, Vendor.Status.BLACKLISTED, "2.10"),
        ]
        vendors = {}
        for gst, user, name, company, email, phone, address, category, status, rating in vendor_specs:
            vendor, _ = Vendor.objects.update_or_create(
                gst_number=gst,
                defaults={
                    "user": user,
                    "name": name,
                    "company_name": company,
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "category": category,
                    "status": status,
                    "rating": rating,
                    "is_deleted": False,
                },
            )
            vendors[company] = vendor
        return vendors

    def _seed_rfqs(self, officer, vendors):
        today = timezone.localdate()
        rfq_specs = [
            {
                "title": "Office Furniture Procurement Q2",
                "description": "Tables, ergonomic chairs, and storage cabinets for the new operations floor.",
                "deadline": today + timedelta(days=12),
                "status": RFQ.Status.PENDING_QUOTATIONS,
                "vendors": ["Infra Supplies Pvt Ltd", "TechCore ITD", "Office Needs Co."],
                "items": [
                    ("Ergonomic Chair", "Mesh back, adjustable lumbar support", 50, "Units"),
                    ("Work Desk", "1200mm laminated workstation desk", 30, "Units"),
                    ("Storage Cabinet", "Lockable metal storage cabinet", 12, "Units"),
                ],
            },
            {
                "title": "Laptop Procurement for Engineering Team",
                "description": "High performance laptops for engineering team with 16GB RAM and 512GB SSD minimum.",
                "deadline": today + timedelta(days=14),
                "status": RFQ.Status.APPROVED,
                "vendors": ["Infra Supplies Pvt Ltd", "TechCore ITD", "CloudNest Solutions"],
                "items": [
                    ("Business Laptop", "16GB RAM, 512GB SSD, i5 or better", 10, "Units"),
                    ("USB-C Dock", "Dual display compatible docking station", 10, "Units"),
                ],
            },
            {
                "title": "Warehouse Logistics Contract",
                "description": "Quarterly freight and local dispatch support for west-zone distribution.",
                "deadline": today + timedelta(days=20),
                "status": RFQ.Status.CLOSED,
                "vendors": ["Northstar Logistics", "SwiftRoute Freight"],
                "items": [
                    ("Monthly Freight Retainer", "Dedicated freight support", 3, "Months"),
                    ("Local Dispatch Runs", "Last-mile dispatch runs", 120, "Runs"),
                ],
            },
            {
                "title": "Annual Facility Maintenance",
                "description": "Preventive maintenance for HVAC, electrical panels, and office utilities.",
                "deadline": today + timedelta(days=9),
                "status": RFQ.Status.PENDING_QUOTATIONS,
                "vendors": ["Prime Facility Services", "Office Needs Co."],
                "items": [
                    ("HVAC Maintenance", "Quarterly preventive maintenance", 4, "Visits"),
                    ("Electrical Inspection", "Monthly safety inspection", 12, "Visits"),
                ],
            },
            {
                "title": "Cloud Infrastructure Support",
                "description": "Managed cloud support, monitoring, backup, and incident response.",
                "deadline": today + timedelta(days=18),
                "status": RFQ.Status.PUBLISHED,
                "vendors": ["TechCore ITD", "CloudNest Solutions"],
                "items": [
                    ("Cloud Support", "24x7 monitoring and support", 12, "Months"),
                    ("Backup Management", "Daily backup monitoring", 12, "Months"),
                ],
            },
            {
                "title": "Packaging Material Bulk Order",
                "description": "Eco-friendly packaging material for outbound shipments.",
                "deadline": today + timedelta(days=6),
                "status": RFQ.Status.REJECTED,
                "vendors": ["GreenPack Materials", "Legacy Hardware Traders"],
                "items": [
                    ("Corrugated Boxes", "3-ply standard shipping boxes", 5000, "Units"),
                    ("Paper Fillers", "Recyclable paper void fillers", 800, "Kg"),
                ],
            },
        ]
        rfqs = {}
        for spec in rfq_specs:
            rfq, _ = RFQ.objects.update_or_create(
                title=spec["title"],
                defaults={
                    "description": spec["description"],
                    "deadline": spec["deadline"],
                    "created_by": officer,
                    "status": spec["status"],
                    "is_deleted": False,
                },
            )
            rfq.assigned_vendors.set([vendors[name] for name in spec["vendors"]])
            for product_name, description, quantity, unit in spec["items"]:
                RFQItem.objects.update_or_create(
                    rfq=rfq,
                    product_name=product_name,
                    defaults={"description": description, "quantity": quantity, "unit": unit},
                )
            rfqs[spec["title"]] = rfq
        return rfqs

    def _seed_quotations_and_workflows(self, users, vendors, rfqs):
        now = timezone.now()
        quote_specs = [
            ("Office Furniture Procurement Q2", "Infra Supplies Pvt Ltd", "185000.00", "33300.00", 10, "4.5/5", "30 days", "Standard 12 month warranty", Quotation.Status.SUBMITTED),
            ("Office Furniture Procurement Q2", "TechCore ITD", "200010.00", "36002.00", 14, "4.2/5", "30 days", "Standard 12 month warranty", Quotation.Status.SUBMITTED),
            ("Office Furniture Procurement Q2", "Office Needs Co.", "214800.00", "38664.00", 7, "3.8/5", "15 days", "Six month replacement warranty", Quotation.Status.SUBMITTED),
            ("Laptop Procurement for Engineering Team", "Infra Supplies Pvt Ltd", "500000.00", "90000.00", 7, "4.5/5", "30 days", "1 year onsite", Quotation.Status.APPROVED),
            ("Laptop Procurement for Engineering Team", "TechCore ITD", "525000.00", "94500.00", 9, "4.2/5", "30 days", "3 year OEM warranty", Quotation.Status.REJECTED),
            ("Warehouse Logistics Contract", "Northstar Logistics", "280000.00", "50400.00", 5, "4.1/5", "20 days", "SLA-backed delivery", Quotation.Status.SELECTED),
            ("Warehouse Logistics Contract", "SwiftRoute Freight", "250000.00", "45000.00", 8, "3.3/5", "15 days", "Standard SLA", Quotation.Status.SUBMITTED),
            ("Annual Facility Maintenance", "Prime Facility Services", "180000.00", "32400.00", 3, "4.35/5", "20 days", "Annual service warranty", Quotation.Status.SUBMITTED),
            ("Annual Facility Maintenance", "Office Needs Co.", "198000.00", "35640.00", 4, "3.8/5", "30 days", "Standard maintenance terms", Quotation.Status.SUBMITTED),
            ("Cloud Infrastructure Support", "TechCore ITD", "360000.00", "64800.00", 2, "4.2/5", "30 days", "Managed support SLA", Quotation.Status.DRAFT),
            ("Cloud Infrastructure Support", "CloudNest Solutions", "410000.00", "73800.00", 1, "4.75/5", "45 days", "Premium SLA", Quotation.Status.DRAFT),
        ]
        quotations = {}
        for rfq_title, vendor_name, price, tax, delivery_days, rating, payment_terms, warranty, quote_status in quote_specs:
            quotation, _ = Quotation.objects.update_or_create(
                rfq=rfqs[rfq_title],
                vendor=vendors[vendor_name],
                defaults={
                    "price": price,
                    "tax": tax,
                    "delivery_days": delivery_days,
                    "warranty": warranty,
                    "notes": f"Payment terms: {payment_terms}\nVendor rating: {rating}\nRemarks: Seeded competitive quotation.",
                    "status": quote_status,
                    "submitted_at": now if quote_status != Quotation.Status.DRAFT else None,
                },
            )
            quotations[(rfq_title, vendor_name)] = quotation

        self._approval(quotations[("Office Furniture Procurement Q2", "Infra Supplies Pvt Ltd")], users["approver"], Approval.Status.PENDING, "")
        self._approval(quotations[("Laptop Procurement for Engineering Team", "Infra Supplies Pvt Ltd")], users["approver"], Approval.Status.APPROVED, "Approved for best price and delivery timeline.")
        self._approval(quotations[("Laptop Procurement for Engineering Team", "TechCore ITD")], users["approver2"], Approval.Status.REJECTED, "Rejected because selected bid had lower total cost.")
        self._approval(quotations[("Warehouse Logistics Contract", "Northstar Logistics")], users["approver2"], Approval.Status.UNDER_REVIEW, "Awaiting final SLA clarification.")

        self._po_invoice(quotations[("Laptop Procurement for Engineering Team", "Infra Supplies Pvt Ltd")], PurchaseOrder.Status.INVOICED, Invoice.Status.PAID, days_due=-3)
        self._po_invoice(quotations[("Warehouse Logistics Contract", "Northstar Logistics")], PurchaseOrder.Status.CONFIRMED, None)

        for user_key, title, message, notification_type in [
            ("vendor_user", "New RFQ Assigned", "You were assigned to Office Furniture Procurement Q2.", "rfq"),
            ("vendor_user2", "Quotation Submitted", "Your quotation for Office Furniture Procurement Q2 is visible to the procurement team.", "quotation"),
            ("approver", "Approval Pending", "A furniture procurement quotation is awaiting your approval.", "approval"),
            ("officer", "Invoice Paid", "Invoice for Laptop Procurement for Engineering Team is marked paid.", "invoice"),
            ("approver2", "SLA Review Needed", "Warehouse Logistics Contract is under review.", "approval"),
        ]:
            Notification.objects.update_or_create(
                user=users[user_key],
                title=title,
                defaults={"message": message, "notification_type": notification_type, "is_read": False},
            )

    def _seed_activity(self, users, rfqs):
        entries = [
            (users["officer"], "create", "RFQ", rfqs["Office Furniture Procurement Q2"].id, "RFQ Office Furniture Procurement Q2 created"),
            (users["officer"], "publish", "RFQ", rfqs["Cloud Infrastructure Support"].id, "RFQ Cloud Infrastructure Support published"),
            (users["vendor_user"], "submit", "Quotation", None, "Infra Supplies submitted furniture quotation"),
            (users["approver"], "approve", "Approval", None, "Laptop procurement approved"),
            (users["officer"], "create", "Invoice", None, "Laptop procurement invoice generated"),
            (users["admin"], "seed_demo", "System", None, "Rich demo procurement dataset seeded"),
        ]
        for user, action, module, object_id, summary in entries:
            AuditLog.objects.update_or_create(
                action=action,
                module=module,
                summary=summary,
                defaults={"user": user, "object_id": object_id, "details": "{}"},
            )

    def _approval(self, quotation, approver, status, remarks):
        quotation.status = Quotation.Status.APPROVED if status == Approval.Status.APPROVED else quotation.status
        if status == Approval.Status.REJECTED:
            quotation.status = Quotation.Status.REJECTED
        elif status in {Approval.Status.PENDING, Approval.Status.UNDER_REVIEW, Approval.Status.ESCALATED}:
            quotation.status = Quotation.Status.SELECTED
        quotation.save(update_fields=["status", "updated_at"])
        approval, _ = Approval.objects.update_or_create(
            quotation=quotation,
            defaults={
                "approver": approver,
                "remarks": remarks,
                "status": status,
                "reviewed_at": timezone.now() if status in {Approval.Status.APPROVED, Approval.Status.REJECTED} else None,
            },
        )
        if status == Approval.Status.APPROVED:
            quotation.rfq.status = RFQ.Status.APPROVED
            quotation.rfq.save(update_fields=["status", "updated_at"])
        return approval

    def _po_invoice(self, quotation, po_status, invoice_status=None, days_due=30):
        po, _ = PurchaseOrder.objects.update_or_create(
            quotation=quotation,
            defaults={"status": po_status},
        )
        if invoice_status:
            Invoice.objects.update_or_create(
                purchase_order=po,
                defaults={
                    "invoice_date": timezone.localdate() - timedelta(days=15),
                    "due_date": timezone.localdate() + timedelta(days=days_due),
                    "status": invoice_status,
                },
            )
        return po

    def _user(self, User, email, username, role, password, first_name="", last_name="", is_staff=False, is_superuser=False):
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "role": role,
                "first_name": first_name,
                "last_name": last_name,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
            },
        )
        user.username = username
        user.role = role
        user.first_name = first_name
        user.last_name = last_name
        user.is_staff = is_staff or is_superuser
        user.is_superuser = is_superuser
        user.set_password(password)
        user.save()
        return user
