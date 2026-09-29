import os
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

def generate_invoice_pdf(order_data: dict, client_data: dict, items_data: list, output_directory: str = "invoices") -> str:
    os.makedirs(output_directory, exist_ok=True)
    
    invoice_no = order_data.get("invoice_number", f"DV-INV-{order_data.get('id', '101')}")
    filename = f"{invoice_no}.pdf"
    filepath = os.path.join(output_directory, filename)
    
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette - Lush Emerald & Dark Slate
    PRIMARY_COLOR = colors.HexColor("#0f5132")   # Dark Emerald Green
    SECONDARY_COLOR = colors.HexColor("#198754") # Fresh Green
    ACCENT_COLOR = colors.HexColor("#d1e7dd")    # Light Mint Green Accent
    TEXT_DARK = colors.HexColor("#212529")
    TEXT_MUTED = colors.HexColor("#6c757d")
    
    header_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=PRIMARY_COLOR,
        spaceAfter=4
    )
    
    tagline_style = ParagraphStyle(
        'Tagline',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        textColor=SECONDARY_COLOR,
        spaceAfter=15
    )
    
    meta_title = ParagraphStyle(
        'MetaTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=TEXT_DARK
    )
    
    meta_value = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=TEXT_MUTED
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.white,
        alignment=1
    )
    
    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=TEXT_DARK
    )

    story = []
    
    # 1. Header Section
    header_data = [
        [
            Paragraph(f"<b>{settings.BUSINESS_NAME}</b>", header_style),
            Paragraph(f"<b>INVOICE</b><br/><font size=12 color='#198754'><b>#{invoice_no}</b></font>", ParagraphStyle('InvHeader', parent=styles['Normal'], alignment=2, fontName='Helvetica-Bold', fontSize=18, textColor=PRIMARY_COLOR))
        ],
        [
            Paragraph(f"{settings.BUSINESS_TAGLINE}<br/>{settings.BUSINESS_ADDRESS}<br/>Phone: {settings.BUSINESS_PHONE} | Email: {settings.BUSINESS_EMAIL}", tagline_style),
            Paragraph(f"<b>Date:</b> {order_data.get('order_date', datetime.date.today().strftime('%d %b %Y'))}<br/><b>Delivery Slot:</b> Morning 5:00 - 7:00 AM", ParagraphStyle('SubDate', parent=styles['Normal'], alignment=2, fontSize=9, textColor=TEXT_DARK))
        ]
    ]
    
    header_table = Table(header_data, colWidths=[3.8*inch, 3.8*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR, spaceBefore=10, spaceAfter=15))
    
    # 2. Client Billing Details Box
    client_info_html = f"""
    <b>Billed To (Customer):</b><br/>
    <font size=11 color="#0f5132"><b>{client_data.get('business_name', 'Hotel Royale')}</b></font> ({client_data.get('client_type', 'HOTEL')})<br/>
    <b>Address:</b> {client_data.get('address', 'M.G. Road, City Center')}<br/>
    <b>Contact:</b> {client_data.get('contact_person', 'Manager')} ({client_data.get('phone', '+91 90000 00000')})<br/>
    <b>Payment Cycle:</b> {client_data.get('payment_cycle', 'WEEKLY')}
    """
    
    payment_info_html = f"""
    <b>Payment Details:</b><br/>
    <b>UPI ID:</b> <font color="#0f5132"><b>{settings.UPI_ID}</b></font><br/>
    <b>Bank:</b> HDFC Wholesale Market Branch<br/>
    <b>A/C No:</b> 50200012345678 (IFSC: HDFC0001234)<br/>
    <b>Account Name:</b> Divine Vegetables
    """
    
    client_table_data = [
        [Paragraph(client_info_html, meta_value), Paragraph(payment_info_html, meta_value)]
    ]
    
    client_table = Table(client_table_data, colWidths=[4.0*inch, 3.6*inch])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ACCENT_COLOR),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 1, SECONDARY_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 15))
    
    # 3. Itemized Products Table
    table_rows = [
        [
            Paragraph("S.No", table_header_style),
            Paragraph("Item & Category", table_header_style),
            Paragraph("Ordered Qty", table_header_style),
            Paragraph("Actual Packed Weight", table_header_style),
            Paragraph("Rate (₹)", table_header_style),
            Paragraph("Amount (₹)", table_header_style)
        ]
    ]
    
    total_amount = 0.0
    for idx, item in enumerate(items_data, start=1):
        ordered_qty = item.get("ordered_qty", 0.0)
        actual_qty = item.get("actual_packed_qty") or ordered_qty
        rate = item.get("price_per_unit", 0.0)
        subtotal = actual_qty * rate
        total_amount += subtotal
        
        qty_weight_str = f"<b>{actual_qty:.1f} {item.get('unit', 'KG')}</b>"
        if actual_qty != ordered_qty:
            qty_weight_str += f" <font color='#dc3545' size=7>(Adj from {ordered_qty} {item.get('unit', 'KG')})</font>"
            
        row = [
            Paragraph(str(idx), ParagraphStyle('C', parent=table_body_style, alignment=1)),
            Paragraph(f"<b>{item.get('product_name', 'Vegetable')}</b>", table_body_style),
            Paragraph(f"{ordered_qty} {item.get('unit', 'KG')}", ParagraphStyle('C', parent=table_body_style, alignment=1)),
            Paragraph(qty_weight_str, ParagraphStyle('C', parent=table_body_style, alignment=1)),
            Paragraph(f"₹{rate:.2f}", ParagraphStyle('R', parent=table_body_style, alignment=2)),
            Paragraph(f"₹{subtotal:.2f}", ParagraphStyle('R', parent=table_body_style, alignment=2))
        ]
        table_rows.append(row)
        
    items_table = Table(table_rows, colWidths=[0.5*inch, 2.7*inch, 1.1*inch, 1.5*inch, 0.9*inch, 0.9*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e0e0e0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))
    
    # 4. Summary & Total Box
    current_balance = client_data.get("current_balance", 0.0)
    grand_total = total_amount + current_balance
    
    summary_data = [
        [Paragraph("Subtotal (Delivered Weight):", ParagraphStyle('R', parent=styles['Normal'], alignment=2)), Paragraph(f"<b>₹{total_amount:.2f}</b>", ParagraphStyle('R', parent=styles['Normal'], alignment=2))],
        [Paragraph("Previous Outstanding Udhaar:", ParagraphStyle('R', parent=styles['Normal'], alignment=2)), Paragraph(f"₹{current_balance:.2f}", ParagraphStyle('R', parent=styles['Normal'], alignment=2))],
        [Paragraph("<b>TOTAL PAYABLE AMOUNT:</b>", ParagraphStyle('R', parent=styles['Normal'], alignment=2, fontSize=11, textColor=PRIMARY_COLOR)), Paragraph(f"<b>₹{grand_total:.2f}</b>", ParagraphStyle('R', parent=styles['Normal'], alignment=2, fontSize=12, textColor=PRIMARY_COLOR))]
    ]
    
    summary_table = Table(summary_data, colWidths=[5.6*inch, 2.0*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,1), (-1,1), 1, PRIMARY_COLOR),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # 5. Stamp / Footer
    footer_text = f"""
    <font size=9 color="#6c757d">
    <b>Terms & Conditions:</b><br/>
    1. Bills are payable as per agreed payment cycle ({client_data.get('payment_cycle', 'WEEKLY')}).<br/>
    2. Quality check to be completed at time of delivery.<br/>
    3. Computer generated invoice by <b>Divine Vegetables System</b>. No signature required.
    </font>
    """
    story.append(Paragraph(footer_text, styles['Normal']))
    
    doc.build(story)
    return filepath

def generate_monthly_report_pdf(report_data: dict, output_directory: str = "invoices") -> str:
    os.makedirs(output_directory, exist_ok=True)
    
    month_name = report_data.get("month_label", "Monthly Business Report")
    filename = f"DV-Monthly-Report-{report_data.get('year_month', '2026-09')}.pdf"
    filepath = os.path.join(output_directory, filename)
    
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    PRIMARY_COLOR = colors.HexColor("#0f5132")
    SECONDARY_COLOR = colors.HexColor("#198754")
    ACCENT_COLOR = colors.HexColor("#d1e7dd")
    TEXT_DARK = colors.HexColor("#212529")
    
    header_style = ParagraphStyle(
        'HeaderTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=22, textColor=PRIMARY_COLOR, spaceAfter=4
    )
    sub_header_style = ParagraphStyle(
        'SubHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, textColor=SECONDARY_COLOR, spaceAfter=12
    )
    table_header_style = ParagraphStyle(
        'TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.white, alignment=1
    )
    table_body_style = ParagraphStyle(
        'TableBody', parent=styles['Normal'], fontName='Helvetica', fontSize=9, textColor=TEXT_DARK
    )
    
    story = []
    
    # 1. Header Title
    header_data = [
        [
            Paragraph(f"<b>{settings.BUSINESS_NAME}</b>", header_style),
            Paragraph(f"<b>MONTHLY BUSINESS REPORT</b><br/><font size=11 color='#198754'><b>{month_name}</b></font>", ParagraphStyle('RHeader', parent=styles['Normal'], alignment=2, fontName='Helvetica-Bold', fontSize=16, textColor=PRIMARY_COLOR))
        ],
        [
            Paragraph(f"{settings.BUSINESS_TAGLINE}<br/>Phone: {settings.BUSINESS_PHONE} | Email: {settings.BUSINESS_EMAIL}", ParagraphStyle('Tagline', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=9, textColor=SECONDARY_COLOR)),
            Paragraph(f"<b>Generated:</b> {datetime.date.today().strftime('%d %b %Y')}", ParagraphStyle('RSubDate', parent=styles['Normal'], alignment=2, fontSize=9, textColor=TEXT_DARK))
        ]
    ]
    
    header_table = Table(header_data, colWidths=[3.8*inch, 3.8*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR, spaceBefore=8, spaceAfter=12))
    
    # 2. Executive Summary Metric Cards
    metrics_html = f"""
    <b>Total Sales Revenue:</b> <font color="#0f5132"><b>₹{report_data.get('total_sales', 0.0):,.2f}</b></font><br/>
    <b>Total Orders Delivered:</b> <b>{report_data.get('total_orders', 0)} Orders</b><br/>
    <b>Average Order Value (AOV):</b> <b>₹{report_data.get('avg_order_value', 0.0):,.2f}</b>
    """
    
    mom_html = f"""
    <b>Month-over-Month (MoM) Growth:</b><br/>
    <b>Vs Previous Month:</b> <font color="{report_data.get('mom_color', '#198754')}"><b>{report_data.get('mom_growth_str', 'N/A')}</b></font><br/>
    <b>Total Outstanding Udhaar:</b> <font color="#dc3545"><b>₹{report_data.get('total_udhaar', 0.0):,.2f}</b></font>
    """
    
    cards_data = [[Paragraph(metrics_html, styles['Normal']), Paragraph(mom_html, styles['Normal'])]]
    cards_table = Table(cards_data, colWidths=[3.8*inch, 3.8*inch])
    cards_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ACCENT_COLOR),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 1, SECONDARY_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(cards_table)
    story.append(Spacer(1, 15))
    
    # 3. Itemized Customer Breakdown Table
    story.append(Paragraph("<b>Itemized Customer Performance Breakdown</b>", sub_header_style))
    
    table_rows = [
        [
            Paragraph("S.No", table_header_style),
            Paragraph("Customer Business Name", table_header_style),
            Paragraph("Category", table_header_style),
            Paragraph("Monthly Sales (₹)", table_header_style),
            Paragraph("Payments Received (₹)", table_header_style),
            Paragraph("Current Udhaar (₹)", table_header_style)
        ]
    ]
    
    client_list = report_data.get("client_breakdown", [])
    for idx, item in enumerate(client_list, start=1):
        row = [
            Paragraph(str(idx), ParagraphStyle('C', parent=table_body_style, alignment=1)),
            Paragraph(f"<b>{item.get('business_name', 'Hotel')}</b>", table_body_style),
            Paragraph(item.get('client_type', 'HOTEL'), ParagraphStyle('C', parent=table_body_style, alignment=1)),
            Paragraph(f"₹{item.get('monthly_sales', 0.0):,.2f}", ParagraphStyle('R', parent=table_body_style, alignment=2)),
            Paragraph(f"₹{item.get('monthly_payments', 0.0):,.2f}", ParagraphStyle('R', parent=table_body_style, alignment=2)),
            Paragraph(f"₹{item.get('current_balance', 0.0):,.2f}", ParagraphStyle('R', parent=table_body_style, alignment=2))
        ]
        table_rows.append(row)
        
    items_table = Table(table_rows, colWidths=[0.5*inch, 2.7*inch, 1.0*inch, 1.1*inch, 1.1*inch, 1.2*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e0e0e0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 20))
    
    # 4. Stamp / Footer
    footer_text = f"""
    <font size=8 color="#6c757d">
    This is an official monthly business audit report generated by <b>Divine Vegetables Supply Engine</b>. All figures derived directly from verified Mandi weight & dispatch logs.
    </font>
    """
    story.append(Paragraph(footer_text, styles['Normal']))
    
    doc.build(story)
    return filepath

