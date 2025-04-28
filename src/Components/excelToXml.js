import * as XLSX from 'xlsx';
import * as xmlbuilder from 'xmlbuilder';

function allowedFile(filename) {
  return filename.split('.').pop().toLowerCase() === 'xlsx'||filename.split('.').pop().toLowerCase() === 'csv'|| filename.split('.').pop().toLowerCase() === 'xls';
}

function sanitizeKey(key) {
  if (typeof key === 'string') {
    return key.replace(/[\r\n]+/g, ' ').trim();
  }
  return '';
}

function getUniqueHeaders(headers) {
  var headerCounts = {};
  var result = [];
  for (var i = 0; i < headers.length; i++) {
    var sanitized = sanitizeKey(headers[i]);
    if (!headerCounts.hasOwnProperty(sanitized)) {
      headerCounts[sanitized] = 1;
      result.push(sanitized);
    } else {
      headerCounts[sanitized]++;
      result.push(sanitized + headerCounts[sanitized]);
    }
  }
  return result;
}

function findHeaderRow(sheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const range = XLSX.utils.decode_range(sheet['!ref']);  
  // Loop through the first 10 rows (or total available rows, whichever is smaller)
  for (let r = 0; r < Math.min(data.length, 10); r++) {
    const rowData = data[r] || []; // Make sure we have an array, even if the row is empty
    const nonEmptyCells = rowData.filter(cell => String(cell).trim() !== "");
    console.log("Row " + (range.s.r + r) + ": ", nonEmptyCells+"-->"+nonEmptyCells.length);
    // If the row has more than 5 non-empty cells, we consider it the header row.
    if (nonEmptyCells.length > 5) {
      // Adjust the row number to match the actual Excel row number.
      return range.s.r + r;
    }
  }
  return range.s.r;
}

function convert(
  file,
  arrayBuffer,
  supplier,
  brand,
  buyer,
  season,
  phase,
  cl,
  gender,
  ST_user,
  ticketType,
  poLocation,
  poType,
  poEDI,
  priceTag,
  nb,
  na,
  mf,
  dealInfo
) {
  const inputFileName = file.name;
  let workbook="";
  if (inputFileName.includes('csv')) {
    // Handle CSV file
    console.log(inputFileName);
    const csvContent = new TextDecoder('utf-8').decode(arrayBuffer);
     workbook = XLSX.read(csvContent, { type: 'string', raw: true });
  } else {
    // Handle Excel file
    console.log(inputFileName);
     workbook = XLSX.read(arrayBuffer, { type: 'array' });
  }
  const supplierName = supplier['value'];
  //const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  console.log(`Sheet name: ${sheetName}`);

  let data;
  if (supplierName === "onlinetextile") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, range: 11 });
  } else if (supplierName === "PVH_FINLAND_OY") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets["product info"], { header: 1 });
  } else if (supplierName === "LONGCHAMP_SAS") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets["DETAIL"], { header: 1 });
  } else if (supplierName === "MULBERRY_GROUP_PLC") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets["EAN with Measurements"], { header: 1 });
  } else if (supplierName === "VAGABOND_FINLAND_OY") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, range: 2 });
  }else if (supplierName === "FALKE_KGAA_SCHMALLENBERG") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1, raw:false});
  }else if (supplierName === "TIGER_OF_SWEDEN_FINLAND_OY") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1,range: 4, raw: false });
  }else if (supplierName === "OSCAR_JACOBSON_AB") {
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1,range: 2,raw: false });
  }else if (supplierName === "testsupplier1" || supplierName === "testsupplier2") {
    console.log(`Sheet name: ${supplierName}`);
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, range: 1});
  } else if (supplierName === "Marc_OPolo_International_GmbH") {
    const sheet = workbook.Sheets[sheetName];
    const fullRange = XLSX.utils.decode_range(sheet['!ref']);
    fullRange.s.r=findHeaderRow(sheet);
    console.log(fullRange.s);
    data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: fullRange });      
  }else if (supplierName === "STICHD_BV_HERTOGENBOSCH") {
      const sheet = workbook.Sheets[sheetName];
      const fullRange = XLSX.utils.decode_range(sheet['!ref']);
      fullRange.s.r = 2;
      fullRange.s.c = 1;
      data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: fullRange });
    }else if (supplierName === "DK_COMPANY_FINLAND_OY") {
      const sheet = workbook.Sheets[sheetName];
      const fullRange = XLSX.utils.decode_range(sheet['!ref']);
      
      const cellRowA1 = sheet["A1"];
      var headerPresent = false;
      if (cellRowA1  && cellRowA1.v.trim() !== "") {
        headerPresent = true;
      }

      if (headerPresent) {
        fullRange.s.r = 0;
      } else{
        fullRange.s.r = 2;
      }
      console.log(fullRange.s);
     data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: fullRange });
    }else if (supplierName === "VIKING_JALKINEET_OY") {
      const sheet = workbook.Sheets[sheetName];
      const fullRange = XLSX.utils.decode_range(sheet['!ref']);
      fullRange.s.r=findHeaderRow(sheet);
      console.log(fullRange.s);
     data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: fullRange });
    }    
  else {
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  }
  
  console.log('Raw data from sheet:', data);

  const root = xmlbuilder.create('STEP-ProductInformation', { encoding: 'UTF-8', headless: true });
  root.att('WorkspaceID', 'Main');
  root.att('ContextID', 'International');

  const Products = root.ele('Products');
  
  // Sanitize headers from the first row of data
  const arrList = data[0] ? getUniqueHeaders(data[0]) : [];
  console.log('Sanitized headers:', arrList);
  
  const finalListValue = [];

  // Process each row starting at index 1
  for (let i = 1; i < data.length; i++) {
    const dictFinal = {};
    let hasValue = false;
    for (let j = 0; j < arrList.length; j++) {
      let cellValue = data[i][j];
      if (typeof cellValue === 'string') {
        cellValue = cellValue.replace(/[\r\n]/g, ' ').trim();
      }
      dictFinal[arrList[j]] = cellValue == null ? "" : cellValue;
      if (cellValue !== undefined && cellValue !== "") {
        hasValue = true;
      }
    }
    if (hasValue) {
      finalListValue.push(dictFinal);
    }
  }

  console.log('Final list value:', finalListValue);
  
  const Product1 = Products.ele('Product', { ParentID: "BuySideRoot", UserTypeID: "BuySideItem" });
  const Product2 = Product1.ele('Values');
  Product2.ele('Value', { AttributeID: "att_fields" }).txt(JSON.stringify(finalListValue));
  Product2.ele('Value', { AttributeID: "att_assignee" }).txt(ST_user);
  Product2.ele('Value', { AttributeID: "att_tool_consumerlifestage" }).txt(cl);
  Product2.ele('Value', { AttributeID: "att_tool_gender" }).txt(gender);
  Product2.ele('Value', { AttributeID: "att_tool_orderpricetags" }).txt(priceTag);
  const phaseValue = phase ? phase : "";
  Product2.ele('Value', { AttributeID: "att_tool_phase" }).txt(phaseValue);
  Product2.ele('Value', { AttributeID: "att_tool_polocation" }).txt(poLocation);
  Product2.ele('Value', { AttributeID: "att_tool_potype" }).txt(poType);
  Product2.ele('Value', { AttributeID: "att_tool_season" }).txt(season);
  Product2.ele('Value', { AttributeID: "att_tool_buyer" }).txt(buyer);
  Product2.ele('Value', { AttributeID: "att_tool_sendedi" }).txt(poEDI);
  Product2.ele('Value', { AttributeID: "att_tool_nbd" }).txt(nb);
  Product2.ele('Value', { AttributeID: "att_tool_nad" }).txt(na);
  Product2.ele('Value', { AttributeID: "att_tool_multifactor" }).txt(mf != null ? mf : "");
  Product2.ele('Value', { AttributeID: "att_tool_supplier" }).txt(supplier["value"]);
  const ticketTypeValue = ticketType ? ticketType : "";
  Product2.ele('Value', { AttributeID: "att_tool_tickettype" }).txt(ticketTypeValue);
  Product2.ele('Value', { AttributeID: "att_tool_brand" }).txt(brand ? brand.value : "");
  Product2.ele('Value', { AttributeID: "att_tool_dealinfo" }).txt(dealInfo);
  const xmlString = root.end({ pretty: true });

  return { success: true, xmlString };
}

export { convert, allowedFile };
