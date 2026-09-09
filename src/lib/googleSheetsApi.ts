import { ProductListing } from "../types";

/**
 * Creates a Google Spreadsheet, populates it with product listings,
 * styles the header row with a professional dark theme, and auto-sizes columns.
 */
export async function exportToGoogleSheets(
  accessToken: string,
  title: string,
  products: ProductListing[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create a Spreadsheet
  const createResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errText}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl;

  // 2. Prepare headers and rows
  const headers = [
    "ID",
    "SKU",
    "Nazwa produktu",
    "Platforma",
    "Cena PLN",
    "Cena EUR",
    "Cena pierwotna PLN",
    "Sprzedaż / msc",
    "Ocena",
    "Liczba ocen",
    "Status",
    "ROI (%)",
    "ASIN",
    "EAN",
    "Adres URL",
    "Kategoria"
  ];

  const rows = products.map((p) => [
    p.id,
    p.sku || "",
    p.name || "",
    p.platform,
    p.pricePLN,
    p.priceEUR || "",
    p.originalPricePLN || "",
    p.salesPerMonth || 0,
    p.rating || 0,
    p.ratingCount || 0,
    p.status || "Aktywny",
    p.roi || 0,
    p.asin || "",
    p.ean || "",
    p.url || "",
    p.category || ""
  ]);

  const values = [headers, ...rows];

  // 3. Write data values (by default, first sheet is 'Sheet1' or 'Arkusz1'. To be safe, use range 'Sheet1!A1')
  // Google Sheets API automatically translates the default sheet range if we specify a standard range.
  // We can write to the first sheet dynamically by omitting or using range 'A1' directly without sheet name prefix.
  const range = "A1"; 
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const updateResponse = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: values,
    }),
  });

  if (!updateResponse.ok) {
    const errText = await updateResponse.text();
    throw new Error(`Failed to update Spreadsheet data: ${errText}`);
  }

  // 4. Send professional batchUpdate request to style headers and resize columns
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          // Bold and styled background for headers
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.12, blue: 0.18 }, // elegant midnight dark slate
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    fontSize: 10,
                  },
                  horizontalAlignment: "CENTER",
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
            },
          },
          // Grid lines visibility
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridLinesVisible: true,
              },
              fields: "gridLinesVisible",
            },
          },
          // Auto-resize column widths based on cell content length
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn("Styling Google Spreadsheet headers failed, but data was saved.", err);
  }

  return { spreadsheetId, spreadsheetUrl };
}
