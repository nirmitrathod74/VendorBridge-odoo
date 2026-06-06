from rest_framework import serializers
from django.utils import timezone

from .models import Approval, AuditLog, Invoice, Notification, PurchaseOrder, Quotation, RFQ, RFQItem


class RFQItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQItem
        fields = ["id", "product_name", "description", "quantity", "unit"]


class RFQSerializer(serializers.ModelSerializer):
    items = RFQItemSerializer(many=True)
    quotation_count = serializers.IntegerField(source="quotations.count", read_only=True)

    class Meta:
        model = RFQ
        fields = "__all__"
        read_only_fields = ["rfq_number", "created_by", "status", "created_at", "updated_at"]

    def validate(self, attrs):
        deadline = attrs.get("deadline", getattr(self.instance, "deadline", None))
        if deadline and deadline < timezone.localdate():
            raise serializers.ValidationError({"deadline": "Submission deadline cannot be in the past."})
        items = self.initial_data.get("items")
        if not self.instance and not items:
            raise serializers.ValidationError({"items": "At least one RFQ item is required."})
        vendors = self.initial_data.get("assigned_vendors")
        if not self.instance and not vendors:
            raise serializers.ValidationError({"assigned_vendors": "Assign at least one vendor."})
        if self.instance and "version" in self.initial_data:
            incoming_version = int(self.initial_data["version"])
            if incoming_version != self.instance.version:
                raise serializers.ValidationError({
                    "version": "This RFQ was changed by someone else. Refresh and try again."
                })
        return attrs

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        vendors = validated_data.pop("assigned_vendors", [])
        rfq = RFQ.objects.create(created_by=self.context["request"].user, **validated_data)
        rfq.assigned_vendors.set(vendors)
        for item in items:
            RFQItem.objects.create(rfq=rfq, **item)
        return rfq

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        vendors = validated_data.pop("assigned_vendors", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.version += 1
        instance.save()
        if vendors is not None:
            instance.assigned_vendors.set(vendors)
        if items is not None:
            instance.items.all().delete()
            for item in items:
                RFQItem.objects.create(rfq=instance, **item)
        return instance


class QuotationSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    vendor_name = serializers.CharField(source="vendor.company_name", read_only=True)
    rfq_number = serializers.CharField(source="rfq.rfq_number", read_only=True)
    rfq_title = serializers.CharField(source="rfq.title", read_only=True)
    rating = serializers.DecimalField(source="vendor.rating", max_digits=3, decimal_places=2, read_only=True)

    class Meta:
        model = Quotation
        fields = "__all__"
        read_only_fields = ["quotation_number", "status", "submitted_at", "created_at", "updated_at", "total"]

    def validate(self, attrs):
        rfq = attrs.get("rfq", getattr(self.instance, "rfq", None))
        vendor = attrs.get("vendor", getattr(self.instance, "vendor", None))
        price = attrs.get("price", getattr(self.instance, "price", None))
        delivery_days = attrs.get("delivery_days", getattr(self.instance, "delivery_days", None))

        if rfq and rfq.deadline < timezone.localdate():
            raise serializers.ValidationError({"rfq": "Cannot submit a quotation after the RFQ deadline."})
        if rfq and rfq.status not in {RFQ.Status.PUBLISHED, RFQ.Status.PENDING_QUOTATIONS}:
            raise serializers.ValidationError({"rfq": "Quotations can only be submitted for published RFQs."})
        if vendor and vendor.status != "active":
            raise serializers.ValidationError({"vendor": "Only active vendors can submit quotations."})
        if price is not None and price < 0:
            raise serializers.ValidationError({"price": "Price cannot be negative."})
        if delivery_days is not None and delivery_days < 1:
            raise serializers.ValidationError({"delivery_days": "Delivery days must be at least 1."})
        return attrs


class ApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.SerializerMethodField()
    quotation_number = serializers.CharField(source="quotation.quotation_number", read_only=True)
    rfq_number = serializers.CharField(source="quotation.rfq.rfq_number", read_only=True)
    rfq_title = serializers.CharField(source="quotation.rfq.title", read_only=True)
    vendor_name = serializers.CharField(source="quotation.vendor.company_name", read_only=True)
    total_amount = serializers.DecimalField(source="quotation.total", max_digits=14, decimal_places=2, read_only=True)
    delivery_days = serializers.IntegerField(source="quotation.delivery_days", read_only=True)
    rating = serializers.DecimalField(source="quotation.vendor.rating", max_digits=3, decimal_places=2, read_only=True)

    class Meta:
        model = Approval
        fields = "__all__"
        read_only_fields = ["approval_number", "quotation", "approver", "status", "reviewed_at", "created_at", "updated_at"]

    def get_approver_name(self, obj):
        return obj.approver.get_full_name() or obj.approver.email


class PurchaseOrderSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    invoice_id = serializers.IntegerField(source="invoice.id", read_only=True, default=None)
    quotation_number = serializers.CharField(source="quotation.quotation_number", read_only=True)
    rfq_number = serializers.CharField(source="quotation.rfq.rfq_number", read_only=True)
    vendor_name = serializers.CharField(source="quotation.vendor.company_name", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = "__all__"
        read_only_fields = ["po_number", "quotation", "status", "created_at", "updated_at", "total", "invoice_id"]


class InvoiceSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    po_number = serializers.CharField(source="purchase_order.po_number", read_only=True)
    po_date = serializers.DateTimeField(source="purchase_order.created_at", read_only=True)
    vendor_name = serializers.CharField(source="purchase_order.quotation.vendor.company_name", read_only=True)
    vendor_address = serializers.CharField(source="purchase_order.quotation.vendor.email", read_only=True)
    vendor_gst = serializers.CharField(source="purchase_order.quotation.vendor.gst_number", read_only=True)
    quotation_number = serializers.CharField(source="purchase_order.quotation.quotation_number", read_only=True)
    rfq_number = serializers.CharField(source="purchase_order.quotation.rfq.rfq_number", read_only=True)
    rfq_title = serializers.CharField(source="purchase_order.quotation.rfq.title", read_only=True)
    notes = serializers.CharField(source="purchase_order.quotation.notes", read_only=True)
    rfq_items = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ["invoice_number", "purchase_order", "pdf_file", "status", "created_at", "updated_at", "total"]

    def get_rfq_items(self, obj):
        items = obj.purchase_order.quotation.rfq.items.all()
        return RFQItemSerializer(items, many=True).data


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["user", "created_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"
