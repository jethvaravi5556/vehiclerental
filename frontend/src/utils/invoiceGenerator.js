// utils/invoiceGenerator.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Ensure autoTable is registered correctly
if (typeof jsPDF.API.autoTable === "undefined") {
  jsPDF.API.autoTable = autoTable;
}

// Core invoice rendering
const createInvoiceContent = (doc, booking) => {
  doc.setFillColor(79, 70, 229); // Indigo
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("VehicleRental Pro", 20, 25);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Vehicle Rental Service", 20, 32);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(
    `INVOICE #${booking._id?.slice(-8)?.toUpperCase() || "N/A"}`,
    140,
    25
  );
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 140, 32);

  // Customer Info
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 55);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(booking.user?.name || "N/A", 20, 65);
  doc.text(booking.user?.email || "N/A", 20, 72);
  doc.text(booking.user?.phone || "N/A", 20, 79);

  // Booking Info
  doc.setFont("helvetica", "bold");
  doc.text("Booking Details:", 110, 55);

  doc.setFont("helvetica", "normal");
  doc.text(`Booking ID: ${booking._id || "N/A"}`, 110, 65);
  doc.text(
    `Status: ${
      booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) ||
      "N/A"
    }`,
    110,
    72
  );
  doc.text(
    `Type: ${
      booking.bookingType === "daily" ? "Daily Rental" : "Hourly Rental"
    }`,
    110,
    79
  );
  doc.text(
    `Booked on: ${new Date(booking.createdAt || Date.now()).toLocaleDateString(
      "en-IN"
    )}`,
    110,
    86
  );

  // Vehicle Info Box
  doc.setFillColor(248, 250, 252);
  doc.rect(20, 95, 170, 25, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Vehicle Information", 25, 105);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Vehicle: ${booking.vehicle?.title || "N/A"}`, 25, 113);
  doc.text(`Brand: ${booking.vehicle?.brand || "N/A"}`, 100, 113);
  doc.text(`Type: ${booking.vehicle?.type || "N/A"}`, 25, 118);
  doc.text(`Model: ${booking.vehicle?.model || "N/A"}`, 100, 118);

  // Rental Table
  const tableData = [];

  if (booking.bookingType === "daily") {
    const start = new Date(booking.startDate).toLocaleDateString("en-IN");
    const end = new Date(booking.endDate).toLocaleDateString("en-IN");
    const days =
      Math.ceil(
        (new Date(booking.endDate) - new Date(booking.startDate)) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    tableData.push([
      "Daily Rental",
      `${start} to ${end}`,
      `${days} day(s)`,
      `₹${(booking.amountPaid || 0).toLocaleString("en-IN")}`,
    ]);
  } else {
    const date = new Date(booking.startDate).toLocaleDateString("en-IN");
    const time = `${booking.startHour || "N/A"} - ${booking.endHour || "N/A"}`;
    tableData.push([
      "Hourly Rental",
      date,
      time,
      `₹${(booking.amountPaid || 0).toLocaleString("en-IN")}`,
    ]);
  }

  tableData.push([
    "Pickup Location",
    booking.pickupLocation || "N/A",
    "-",
    "Included",
  ]);
  if (booking.dropLocation && booking.dropLocation !== booking.pickupLocation) {
    tableData.push(["Drop Location", booking.dropLocation, "-", "Included"]);
  }

  doc.autoTable({
    startY: 130,
    head: [["Service", "Details", "Duration/Time", "Amount"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      3: { halign: "right" }, // only right-align Amount
    },
  });

  const subtotal = booking.amountPaid || 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal;

  const finalY = doc.lastAutoTable?.finalY
    ? doc.lastAutoTable.finalY + 10
    : 200;

  doc.setFillColor(248, 250, 252);
  doc.rect(130, finalY, 60, 35, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Subtotal:", 135, finalY + 8);
  doc.text(`₹${subtotal.toLocaleString("en-IN")}`, 180, finalY + 8, {
    align: "right",
  });
  doc.text("GST (18%):", 135, finalY + 16);
  doc.text(`₹${tax.toLocaleString("en-IN")}`, 180, finalY + 16, {
    align: "right",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", 135, finalY + 26);
  doc.text(`₹${total.toLocaleString("en-IN")}`, 180, finalY + 26, {
    align: "right",
  });

  const paymentStatus = booking.paymentStatus || "paid";
  const statusColor = paymentStatus === "paid" ? [34, 197, 94] : [239, 68, 68];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...statusColor);
  doc.text(`Payment Status: ${paymentStatus.toUpperCase()}`, 20, finalY + 26);

  // Terms
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Terms & Conditions:", 20, finalY + 45);
  doc.text(
    "• Please carry valid driving license and ID proof",
    20,
    finalY + 52
  );
  doc.text(
    "• Vehicle should be returned in the same condition",
    20,
    finalY + 57
  );
  doc.text("• Fuel charges are additional unless specified", 20, finalY + 62);
  doc.text("• Cancellation charges may apply as per policy", 20, finalY + 67);

  // Footer
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 280, 210, 17, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Thank you for choosing VehicleRental Pro!", 20, 290);
  doc.text("Contact: support@vehiclerentalpro.com | +91-XXXXX-XXXXX", 20, 294);
};

// 1. Generate and download invoice
export const generateInvoice = (booking) => {
  try {
    const doc = new jsPDF();
    createInvoiceContent(doc, booking);

    const fileName = `invoice_${booking._id?.slice(-8) || "unknown"}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    return { success: true, message: "Invoice downloaded", fileName };
  } catch (error) {
    console.error("Error generating invoice:", error);
    return { success: false, message: error.message };
  }
};

// 2. Generate invoice and return blob (for email, preview, etc.)
export const generateInvoiceBlob = (booking) => {
  try {
    const doc = new jsPDF();
    createInvoiceContent(doc, booking);

    const fileName = `invoice_${booking._id?.slice(-8) || "unknown"}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    const pdfBytes = doc.output("arraybuffer");

    const file = new File([pdfBytes], fileName, { type: "application/pdf" });

    if (!file || file.size === 0) {
      throw new Error("Generated file is empty");
    }

    return { success: true, file, fileName };
  } catch (error) {
    console.error("Error generating invoice file:", error);
    return { success: false, message: error.message };
  }
};


// 3. Preview invoice in a new browser tab
export const previewInvoice = (booking) => {
  try {
    const doc = new jsPDF();
    createInvoiceContent(doc, booking);

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 3000);

    return { success: true, message: "Invoice preview opened" };
  } catch (error) {
    console.error("Error previewing invoice:", error);
    return { success: false, message: error.message };
  }
};
