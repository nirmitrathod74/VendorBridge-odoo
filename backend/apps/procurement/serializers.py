from rest_framework import serializers

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
        read_only_fields = ["rfq_number", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
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

    class Meta:
        model = Quotation
        fields = "__all__"
        read_only_fields = ["quotation_number", "submitted_at", "created_at", "updated_at", "total"]


class ApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Approval
        fields = "__all__"
        read_only_fields = ["approval_number", "approver", "reviewed_at", "created_at", "updated_at"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = "__all__"
        read_only_fields = ["po_number", "created_at", "updated_at", "total"]


class InvoiceSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ["invoice_number", "pdf_file", "created_at", "updated_at", "total"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["user", "created_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"
