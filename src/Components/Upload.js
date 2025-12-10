import React, { useState, useRef } from 'react';
import { Container, Row, Col, Form, Alert, Modal, Button, Toast, ToastContainer } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Select from 'react-select';
import { convert, allowedFile } from "./excelToXml";  // Ensure this is correctly implemented
import { suppliers, departments, getDepartmentsForSupplier, departmentGenderMap, departmentLifestageMap, buyers, seasons, phases, lifestages, genders, ST_users, ticketTypes, poLocations, poTypes, poEDIs, orderPriceTags, multiplicationFactorOptions, brands, pps } from './constants';
import SubmitButton from './SubmitButton';  // Import the new component
import '../styles/styles.css';
import axios from 'axios';

function Upload() {
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedDepartment, setselectedDepartment] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [buyer, setBuyer] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [lifestage, setLifestage] = useState(null);
  const [gender, setGender] = useState("");
  const [ST_user, setSTUser] = useState(null);
  const [vatPriceChange, setVatPriceChange] = useState("");
  const [selectedTicketType, setSelectedTicketType] = useState("");
  const [poLocation, setPOLocation] = useState("Distribution Centre B&M");
  const [poType, setPOType] = useState("PRE");
  const [poEDI, setPOEDI] = useState("No");
  const [priceTag, setPriceTag] = useState("No");
  const [notBefore, setNotBefore] = useState("");
  const [notAfter, setNotAfter] = useState("");
  const [multiplicationFactor, setMultiplicationFactor] = useState("");
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState(null); // State to store the converted XML file
  const [dealInfo, setDealInfo] = useState("");
   const [pp, setPP] = useState("No");
  const [showPromoViewModal, setShowPromoViewModal] = useState(false);

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoFormData, setPromoFormData] = useState({
    promoName: "",
    promoBudget: "",
    promoStart: "",
    promoEnd: ""
  });
  const [savedPromoData, setSavedPromoData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [promoType, setPromoType] = useState("");

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  const [promoDisplayText, setPromoDisplayText] = useState("");

  const allMonths = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" }
  ];

  const today = new Date();
  const [manualPromoData, setManualPromoData] = useState({
    year: "",
    month: "",
    duration: "",
    category: "",
    discount: "",
    applicableAreas: []
  });


  const [selectedEvent, setSelectedEvent] = useState("");        // Radio (Level 1)
  const [selectedPromos, setSelectedPromos] = useState({});     // Checkbox (Level 2)

  const [expandedEvent, setExpandedEvent] = useState(null);   // event expand
  const [expandedPromo, setExpandedPromo] = useState(null);   // promo expand

const isManualFilled =
  promoType &&
  (manualPromoData.year ||
    manualPromoData.month ||
    manualPromoData.duration ||
    manualPromoData.category ||
    manualPromoData.discount ||
    manualPromoData.applicableAreas.length > 0);

const isApiSelected = Object.keys(selectedPromos).length > 0;

  const formRef = useRef(null);  // Ref for form element

  const resetForm = () => {
    setFile(null);
    setErrorMessage(null);
    setSelectedSupplier(null);
    setselectedDepartment("");
    setSelectedBrand("");
    setBuyer("");
    setSelectedSeason("");
    setSelectedPhase("");
    setLifestage("");
    setGender("");
    setSTUser("");
    setVatPriceChange("");
    setSelectedTicketType("");
    setPOLocation("Distribution Centre B&M");
    setPOType("PRE");
    setPOEDI("No");
    setPriceTag("No");
    setNotBefore("");
    setNotAfter("");
    setMultiplicationFactor("");
    setFileInputKey(Date.now());
    setConvertedBlob(null);
    setDealInfo("");
    setPP("No");
    setSavedPromoData(null);
    setPromoFormData({
      promoName: "",
      promoBudget: "",
      promoStart: "",
      promoEnd: ""
    });
    setPromoDisplayText("");
  };

const handlePromoCancel = () => {
  setShowPromoModal(false);

  // ✅ Only revert to NO if nothing was ever saved
  if (!savedPromoData) {
    setPP("No");
  }

  setExpandedEvent(null);
  setExpandedPromo(null);
};


  const handlePromoSave = () => {
  setSavedPromoData(selectedPromos);  // ✅ Save only checked components
  setShowPromoModal(false);
  setPP("Yes");
};

  const getAvailableMonths = () => {
    if (!manualPromoData.year) return allMonths;
    if (parseInt(manualPromoData.year) === currentYear) {
      return allMonths.filter(m => m.value >= today.getMonth());
    }
    return allMonths;
  };

  const buildManualPromoDisplay = () => {
  const { year, month, duration, category, discount, applicableAreas } = manualPromoData;

  return applicableAreas
    .map(area =>
      [
        promoType,
        year,
        month || duration || category || discount,
        area
      ]
        .filter(Boolean)
        .join(" | ")
    )
    .join(" ; ");
};

const buildApiPromoDisplay = () => {
  const output = [];

  campaigns.forEach(campaign => {
    Object.entries(selectedPromos).forEach(([promoName, comps]) => {
      comps.forEach(comp => {
        output.push(`${campaign.event} | ${promoName} | ${comp}`);
      });
    });
  });

  return output.join(" ; ");
};

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMessage(null);
  };

  // Step 1: Convert file and trigger local download before confirmation
  const handleConvertAndDownload = () => {
    if (!file || !selectedSupplier || !buyer || !ST_user || !lifestage || !selectedDepartment) {
      setErrorMessage('Please fill out all the mandatory fields.');
      return;
    }

    if (!allowedFile(file.name)) {
      setErrorMessage('Invalid file format. Please upload a .xlsx file.');
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;

        // Convert the file to XML (note: lifestyle parameters have been removed)
        const result = convert(
          file,
          arrayBuffer,
          selectedSupplier,
          selectedDepartment,
          selectedBrand,
          buyer,
          selectedSeason,
          selectedPhase,
          lifestage,
          gender,
          ST_user,
          selectedTicketType,
          poLocation,
          poType,
          poEDI,
          priceTag,
          notBefore,
          notAfter,
          multiplicationFactor,
          dealInfo,
          vatPriceChange,
          savedPromoData
        );

        // Check if conversion was successful
        if (!result.success) {
          setErrorMessage(`Conversion failed: ${result.error}`);
          return;
        }

        // Check if the XML content appears empty or unreadable
        if (result.xmlString.includes('<Value AttributeID="att_fields">[]</Value>')) {
          setErrorMessage('Error: File can\'t be delivered as it appears empty or unread.');
          return;
        }

        // Create a Blob from the XML string
        const xmlBlob = new Blob([result.xmlString], { type: 'application/xml' });

        // Trigger the local download of the file
        const downloadUrl = window.URL.createObjectURL(xmlBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', 'output.xml');
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Save the converted file for later sending
        setConvertedBlob(xmlBlob);

        // Now show the confirmation modal for sending to the API Gateway
        setShowConfirmation(true);
      } catch (conversionError) {
        setErrorMessage(`Conversion error: ${conversionError.message}`);
      }
    };

    fileReader.onerror = (error) => {
      setErrorMessage(`File reading error: ${error.message}`);
    };

    fileReader.readAsArrayBuffer(file);
  };

  // Step 2: Send the converted file to the API Gateway after confirmation
  const handleConfirmSubmit = async () => {
    setShowConfirmation(false); // Hide the modal

    if (!convertedBlob) {
      setErrorMessage("No converted file available for sending.");
      return;
    }


    const proxyUrl = 'https://p8dzzvc71j.execute-api.eu-west-1.amazonaws.com/default/opil-converter-tool-to-pim'; // Replace with your actual API Gateway URL

    const environment = 'qa';

    try {
      const response = await axios.post(proxyUrl, convertedBlob, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Environment': environment
        },
      });

      if (response.status === 200) {
        console.log('File sent to API Gateway proxy successfully.');
        setShowSuccessToast(true);
        resetForm();
      } else {
        setErrorMessage('Server did not acknowledge the file.');
      }
    } catch (error) {
      console.error('Error sending file:', error);
      setErrorMessage('An error occurred while sending the file.');
    }
  };

  const brandOptions = selectedSupplier ? brands[selectedSupplier.value] || [] : [];
 React.useEffect(() => {
    if (showPromoModal) {
      fetchCampaigns();
    }
  }, [showPromoModal]);

  React.useEffect(() => {
  if (showPromoModal && savedPromoData?.source === "API") {
    setSelectedPromos(savedPromoData.promos || {});
  }

  if (showPromoModal && savedPromoData?.source === "MANUAL") {
    setPromoType(savedPromoData.promoType || "");
    setManualPromoData({
      year: savedPromoData.year || "",
      month: savedPromoData.month || "",
      duration: savedPromoData.duration || "",
      category: savedPromoData.category || "",
      discount: savedPromoData.discount || "",
      applicableAreas: savedPromoData.applicableAreas || []
    });
  }
}, [showPromoModal]);

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await axios.get("http://127.0.0.1:8000/campaigns");
      setCampaigns(res.data);
    } catch (err) {
      console.error("Campaign API Error:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };
  const handleSupplierChange = (selectedOption) => {
    setSelectedSupplier(selectedOption);
    setSelectedBrand(null); // Reset brand selection when supplier changes
    setselectedDepartment(null);
  };

  const handleBrandChange = (selectedOption) => {
    setSelectedBrand(selectedOption);
  };

  const supplierDepts = selectedSupplier
    ? getDepartmentsForSupplier(selectedSupplier.value).map(d => ({
      ...d,
      isSupplierDept: true
    }))
    : [];

  const allOptions = selectedSupplier
    ? [
      ...supplierDepts,
      ...departments().filter(d => !supplierDepts.some(sd => sd.value === d.value))
    ]
    : departments();

  const handleDepartmentChange = (selectedOption) => {
    setselectedDepartment(selectedOption || " ");
    if (selectedOption?.value === "MULTIPLE_DEPARTMENTS") {
      // Reset department, gender, lifestage → nothing added
      setGender("");
      setLifestage("");
      return;
    }
    if (selectedOption) {
      const deptId = selectedOption.value;

      // Set Gender
      if (departmentGenderMap.Men.includes(deptId)) {
        setGender("Men");
      } else if (departmentGenderMap.Women.includes(deptId)) {
        setGender("Women");
      } else {
        setGender("");
      }

      // Set Lifestage
      if (departmentLifestageMap.Adult.includes(deptId)) {
        setLifestage("Adult");
      } else if (departmentLifestageMap.Kids.includes(deptId)) {
        setLifestage("Kids");
      } else {
        setLifestage("");
      }

    } else {
      setGender("");
      setLifestage("");
    }
  };

  const handlePOLocationChange = (selectedOption) => {
    setPOLocation(selectedOption);
    if (selectedOption === "Distribution Centre DR warehouse") {
      setPOType("CD");
    } else if (["Distribution Centre B&M", "Helsinki Department Store", "Itis Department Store", "Jumbo Department Store", "Riga Department Store", "Tallinn Department Store", "Tampere Department Store", "Tapiola Department Store", "Turku Department Store"].includes(selectedOption)) {
      setPOType("PRE");
    }
  };

  const handlePOTypeChange = (selectedOption) => {
    setPOType(selectedOption);
    if (selectedOption === "CD" && poLocation === "Distribution Centre B&M") {
      setPOLocation("Distribution Centre DR warehouse");
    } else if (selectedOption === "PRE" && poLocation === "Distribution Centre DR warehouse") {
      setPOLocation("Distribution Centre B&M");
    }
  };

  return (
    <Container className="bg-image">
      {/* Success Toast */}
      <ToastContainer position="top-center" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowSuccessToast(false)} show={showSuccessToast} delay={3000} autohide bg="success">
          <Toast.Header>
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">File successfully sent!</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Confirmation Modal */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to send the file to the server? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmation(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirmSubmit}>Yes, Send</Button>
        </Modal.Footer>
      </Modal>

      {/* Promo View Modal */}
      <Modal
        show={showPromoViewModal}
        onHide={() => setShowPromoViewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Selected Promotions</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {savedPromoData?.source === "MANUAL" && (
            <>
              <h6>Manual Promotion</h6>
              <table className="table table-bordered mt-3">
                <thead>
                  <tr>
                    <th>Promo Type</th>
                    <th>Year</th>
                    <th>Month / Duration</th>
                    <th>Area</th>
                  </tr>
                </thead>
                <tbody>
                  {savedPromoData.applicableAreas.map((area, idx) => (
                    <tr key={idx}>
                      <td>{savedPromoData.promoType}</td>
                      <td>{savedPromoData.year}</td>
                      <td>
                        {savedPromoData.month ||
                          savedPromoData.duration ||
                          savedPromoData.category ||
                          savedPromoData.discount}
                      </td>
                      <td>{area}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {savedPromoData?.source === "API" && (
            <>
              <h6>API Campaign Selection</h6>
              <table className="table table-bordered mt-3">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Promo</th>
                    <th>Component</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(savedPromoData.promos).map(([promoName, comps]) =>
                    comps.map((comp, idx) => {
                      const eventName =
                        campaigns.find(c =>
                          Object.keys(c.promos).includes(promoName)
                        )?.event || "-";

                      return (
                        <tr key={`${promoName}-${idx}`}>
                          <td>{eventName}</td>
                          <td>{promoName}</td>
                          <td>{comp}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPromoViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Promo Entry Modal */}
      <Modal show={showPromoModal} onHide={handlePromoCancel} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Promo Proposal</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto" }}>

          {/* ===================== */}
          {/* ✅ MANUAL ENTRY SECTION */}
          {/* ===================== */}
          <h5 className="mb-3">Manual Promo Entry</h5>

          {isApiSelected && (
            <Alert variant="warning">
              You are using <strong>API Campaign Selection</strong>.
              Manual entry is disabled.
            </Alert>
          )}

          <div style={{
            opacity: isApiSelected ? 0.4 : 1,
            pointerEvents: isApiSelected ? "none" : "auto"
          }}>
            <Form.Group className="mb-3">
              <Form.Label>Promo Type</Form.Label>
              <Form.Select
                value={promoType}
                onChange={(e) => {
                  setSelectedPromos({});
                  setPromoDisplayText("");
                  setPromoType(e.target.value);
                  setManualPromoData({
                    year: "",
                    month: "",
                    duration: "",
                    category: "",
                    discount: "",
                    applicableAreas: []
                  });
                }}
              >
                <option value="">Select Type...</option>
                <option>LC</option>
                <option>CD</option>
                <option>Magazine</option>
                <option>Buyers Own Promotion</option>
                <option>Launches</option>
              </Form.Select>
            </Form.Group>

            {/* ✅ YEAR (COMMON FOR ALL) */}
            {promoType && (
              <Form.Group className="mb-3">
                <Form.Label>Year</Form.Label>
                <Form.Select
                  value={manualPromoData.year}
                  onChange={(e) =>
                    setManualPromoData({ ...manualPromoData, year: e.target.value })
                  }
                >
                  <option value="">Select Year...</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {/* ✅ LC */}
            {promoType === "LC" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Month</Form.Label>
                  <Form.Select
                    value={manualPromoData.month}
                    onChange={(e) =>
                      setManualPromoData({ ...manualPromoData, month: e.target.value })
                    }
                  >
                    <option value="">Select Month...</option>
                    {getAvailableMonths().map(m => (
                      <option key={m.value} value={m.label}>{m.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Label>Applicable Areas</Form.Label>
                {["L FI", "Non L FI", "L BA", "Non L BA"].map(area => (
                  <Form.Check
                    key={area}
                    type="checkbox"
                    label={area}
                    checked={manualPromoData.applicableAreas.includes(area)}
                    onChange={(e) => {
                      const updated = [...manualPromoData.applicableAreas];
                      e.target.checked
                        ? updated.push(area)
                        : updated.splice(updated.indexOf(area), 1);

                      setManualPromoData({ ...manualPromoData, applicableAreas: updated });
                    }}
                  />
                ))}
              </>
            )}

            {/* ✅ CD */}
            {promoType === "CD" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Duration</Form.Label>
                  <Form.Select
                    value={manualPromoData.duration}
                    onChange={(e) =>
                      setManualPromoData({ ...manualPromoData, duration: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    <option>Spring</option>
                    <option>Autumn</option>
                  </Form.Select>
                </Form.Group>

                <Form.Label>Applicable Areas</Form.Label>
                {[
                  "L FI", "Non L FI", "Additions FIBA",
                  "Normal priced items", "Only Web FIBA", "WEB Evening"
                ].map(area => (
                  <Form.Check
                    key={area}
                    type="checkbox"
                    label={area}
                    checked={manualPromoData.applicableAreas.includes(area)}
                    onChange={(e) => {
                      const updated = [...manualPromoData.applicableAreas];
                      e.target.checked
                        ? updated.push(area)
                        : updated.splice(updated.indexOf(area), 1);

                      setManualPromoData({ ...manualPromoData, applicableAreas: updated });
                    }}
                  />
                ))}
              </>
            )}

            {/* ✅ MAGAZINE */}
            {promoType === "Magazine" && (
              <Form.Group className="mb-3">
                <Form.Label>Month</Form.Label>
                <Form.Select
                  value={manualPromoData.month}
                  onChange={(e) =>
                    setManualPromoData({ ...manualPromoData, month: e.target.value })
                  }
                >
                  <option value="">Select Month...</option>
                  {getAvailableMonths().map(m => (
                    <option key={m.value} value={m.label}>{m.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {/* ✅ BUYERS OWN PROMOTION */}
            {promoType === "Buyers Own Promotion" && (
              <>
                <Form.Label>Category</Form.Label>
                {["Men", "Women", "Children"].map(cat => (
                  <Form.Check
                    key={cat}
                    type="radio"
                    name="promoCategory"
                    label={cat}
                    checked={manualPromoData.category === cat}
                    onChange={() =>
                      setManualPromoData({ ...manualPromoData, category: cat })
                    }
                  />
                ))}
              </>
            )}

            {/* ✅ LAUNCHES */}
            {promoType === "Launches" && (
              <Form.Group className="mb-3">
                <Form.Label>Discount</Form.Label>
                <Form.Select
                  value={manualPromoData.discount}
                  onChange={(e) =>
                    setManualPromoData({ ...manualPromoData, discount: e.target.value })
                  }
                >
                  <option value="">Select...</option>
                  <option>10%</option>
                  <option>15%</option>
                </Form.Select>
              </Form.Group>
            )}

          </div>

          <hr />

          {/* ===================== */}
          {/* ✅ API LOADED SECTION */}
          {/* ===================== */}
          <h5 className="mb-3">Load From Existing Campaigns</h5>

          {isManualFilled && (
            <Alert variant="warning">
              You are using <strong>Manual Promo Entry</strong>.
              API selection is disabled.
            </Alert>
          )}

          <div style={{
            opacity: isManualFilled ? 0.4 : 1,
            pointerEvents: isManualFilled ? "none" : "auto"
          }}>

            {loadingCampaigns && <p>Loading campaigns...</p>}

            {!loadingCampaigns && campaigns.map((campaign, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <div
                  style={{ cursor: "pointer", fontWeight: "bold" }}
                  onClick={() =>
                    setExpandedEvent(expandedEvent === campaign.event ? null : campaign.event)
                  }
                >
                  {expandedEvent === campaign.event ? "▼" : "▶"} {campaign.event}
                </div>

                {expandedEvent === campaign.event && (
                  <div style={{ paddingLeft: "20px" }}>
                    {Object.entries(campaign.promos).map(([promoName, promoObj]) => (
                      <div key={promoName}>
                        <div
                          style={{ cursor: "pointer", fontWeight: 600 }}
                          onClick={() =>
                            setExpandedPromo(expandedPromo === promoName ? null : promoName)
                          }
                        >
                          {expandedPromo === promoName ? "▼" : "▶"} {promoName}
                        </div>

                        {expandedPromo === promoName && (
                          <div style={{ paddingLeft: "25px" }}>
                            {promoObj.promoComp.map((comp, i) => (
                              <Form.Check
                                key={i}
                                type="checkbox"
                                label={comp}
                                checked={
                                  selectedPromos?.[promoName]?.includes(comp) || false
                                }
                                onChange={(e) => {
                                  setPromoType("");
                                  setManualPromoData({
                                    year: "",
                                    month: "",
                                    duration: "",
                                    category: "",
                                    discount: "",
                                    applicableAreas: []
                                  });
                                  setPromoDisplayText("");
                                  setSelectedPromos(prev => {
                                    const updated = { ...prev };
                                    const existing = updated[promoName] || [];

                                    if (e.target.checked) {
                                      updated[promoName] = [...existing, comp];
                                    } else {
                                      updated[promoName] =
                                        existing.filter(x => x !== comp);
                                    }
                                    return updated;
                                  });
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            ))}

          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handlePromoCancel}>
            Cancel
          </Button>

          <Button
            variant="success"
            disabled={!isManualFilled && !isApiSelected && !savedPromoData}
            onClick={() => {

              if (isManualFilled && isApiSelected) {
                alert("You can choose only ONE: Manual Promo OR API Campaign.");
                return;
              }

              // ✅ MANUAL MODE SAVE
              if (isManualFilled) {
                const formatted = buildManualPromoDisplay();

                setSavedPromoData({
                  source: "MANUAL",
                  promoType,
                  ...manualPromoData,
                  display: formatted
                });

                setPromoDisplayText(formatted);   // ✅ FOR MAIN SCREEN DISPLAY
              }

              // ✅ API MODE SAVE
              if (isApiSelected) {
                const formatted = buildApiPromoDisplay();

                setSavedPromoData({
                  source: "API",
                  promos: selectedPromos,
                  display: formatted
                });

                setPromoDisplayText(formatted);   // ✅ FOR MAIN SCREEN DISPLAY
              }

              setShowPromoModal(false);
              setPP("Yes");
            }}
          >
            Save Promo
          </Button>

        </Modal.Footer>
      </Modal>

      <Row className="justify-content-md-center mt-5">
        <Col md="8">
          <Form ref={formRef} className="p-4 bg-light rounded shadow">
            <h4 className="mb-4">Product Creation Form - QAT</h4>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            <Row>
              <Col md="6">
                {/* Left Column Fields */}
                <Form.Group className="mb-3">
                  <Form.Label>Supplier <span style={{ color: "red" }}>*</span></Form.Label>                  <Select
                    options={suppliers()}
                    value={selectedSupplier}
                    onChange={handleSupplierChange}
                    placeholder="Select a supplier..."
                    isSearchable={true}
                    required
                  />
                </Form.Group>
                {selectedSupplier && brandOptions.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>{`${selectedSupplier.label}'s Brand`}</Form.Label>
                    <Select
                      options={brandOptions}
                      value={selectedBrand}
                      onChange={handleBrandChange}
                      placeholder="Select a brand..."
                      isSearchable={true}
                    />
                  </Form.Group>
                )}
                <Form.Group className="mb-3">
                  <Form.Label> Department <span style={{ color: "red" }}>*</span></Form.Label>
                  <Select
                    options={allOptions}
                    onChange={handleDepartmentChange}
                    value={selectedDepartment || null}
                    placeholder="Select a department..."
                    isSearchable={true}
                    isClearable={true}
                    getOptionLabel={(option) => option.label}
                    getOptionValue={(option) => option.value}
                    styles={{
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isFocused
                          ? "#0d6efd" // very dark blue on hover
                          : state.data.isSupplierDept
                            ? "#d6e9ff" // grey-blue for supplier departments when not focused
                            : "white",
                        color: state.isFocused ? "white" : "black"
                      })
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Assortment Lead <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Select aria-label="Select Assortment Lead" onChange={(e) => setBuyer(e.target.value)} value={buyer} required>
                    <option value="" disabled selected>Select Assortment Lead...</option>
                    {buyers.map((b, index) => (
                      <option key={index} value={b}>{b}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Season </Form.Label>
                  <Form.Select
                    aria-label="Select Season"
                    onChange={(e) => {
                      setSelectedSeason(parseInt(e.target.value));
                      setSelectedPhase(""); // Reset phase on season change
                    }}
                    value={selectedSeason}
                    required
                  >
                    <option>Select...</option>
                    {seasons.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phase</Form.Label>
                  <Form.Select aria-label="Select Phase" onChange={(e) => setSelectedPhase(e.target.value)} value={selectedPhase}>
                    <option>Select...</option>
                    {phases[selectedSeason]?.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Consumer Lifestage <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Select aria-label="Select Lifestage" onChange={(e) => setLifestage(e.target.value)} value={lifestage} required>
                    <option value="" disabled selected>Select Consumer Lifestage...</option>
                    {lifestages.map((ls, index) => (
                      <option key={index} value={ls}>{ls}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select aria-label="Select Gender" onChange={(e) => setGender(e.target.value)} value={gender}>
                    <option>Select...</option>
                    {genders.map((g, index) => (
                      <option key={index} value={g}>{g}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>ST User <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Select aria-label="Select ST User" onChange={(e) => setSTUser(e.target.value)} value={ST_user} required>
                    <option value="" disabled selected>Select ST User...</option>
                    {ST_users.map((user, index) => (
                      <option key={index} value={user}>{user}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>VAT Price Change?</Form.Label>
                  <Form.Select aria-label="Select VAT Price Change" onChange={(e) => setVatPriceChange(e.target.value)} value={vatPriceChange}>
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Upload File <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Control type="file" onChange={handleFileChange} key={fileInputKey} required />
                </Form.Group>
              </Col>
              <Col md="6">
                {/* Right Column Fields */}
                <Form.Group className="mb-3">
                  <Form.Label>Ticket Type</Form.Label>
                  <Form.Select
                    aria-label="Select Ticket Type"
                    onChange={(e) => setSelectedTicketType(e.target.value)}
                    value={selectedTicketType || ""}
                  >
                    <option>Select...</option>
                    {ticketTypes.map((ttype, index) => (
                      <option key={index} value={ttype.value}>{ttype.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>PO Location</Form.Label>
                  <Form.Select aria-label="Select PO Location" onChange={(e) => handlePOLocationChange(e.target.value)} value={poLocation}>
                    {poLocations.map((location, index) => (
                      <option key={index} value={location}>{location}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>PO Type</Form.Label>
                  <Form.Select aria-label="Select PO Type" onChange={(e) => handlePOTypeChange(e.target.value)} value={poType}>
                    {poTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Send PO via EDI</Form.Label>
                  <Form.Select aria-label="Select EDI" onChange={(e) => setPOEDI(e.target.value)} value={poEDI}>
                    {poEDIs.map((edi, index) => (
                      <option key={index} value={edi}>{edi}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Order Price Tags</Form.Label>
                  <Form.Select aria-label="Select Price Tag" onChange={(e) => setPriceTag(e.target.value)} value={priceTag}>
                    {orderPriceTags.map((tag, index) => (
                      <option key={index} value={tag}>{tag}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Not Before Date</Form.Label>
                  <Form.Control type="date" value={notBefore} onChange={(e) => setNotBefore(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Not After Date</Form.Label>
                  <Form.Control type="date" value={notAfter} onChange={(e) => setNotAfter(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Multiplication Factor (Optional)</Form.Label>
                  <Select
                    options={multiplicationFactorOptions}
                    value={multiplicationFactorOptions.find(option => option.value === multiplicationFactor) || null}
                    onChange={(option) => setMultiplicationFactor(option ? option.value : null)}
                    placeholder="Select..."
                    isSearchable={true}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>PO Exclusive Deal</Form.Label>
                  <Form.Control
                    type="number"
                    value={dealInfo}
                    onChange={(e) => setDealInfo(e.target.value)}
                    placeholder="Enter Deal Info..."
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Promo Proposal</Form.Label>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Form.Select
                      aria-label="propose Promo"
                      value={pp}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (value === "Yes") {
                          setPP("Yes");
                          setShowPromoModal(true);   // ✅ open overlay
                        } else {
                          setPP("No");
                          setSavedPromoData(null);  // ✅ reset everything
                        }
                      }}
                    >
                      {pps.map((promop, index) => (
                        <option key={index} value={promop}>
                          {promop}
                        </option>
                      ))}
                    </Form.Select>

                    {pp === "Yes" && promoDisplayText && (
                      <Form.Group className="mb-3">
                        <Form.Label>Selected Promos</Form.Label>

                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <Button
                            variant="outline-success"
                            onClick={() => setShowPromoViewModal(true)}
                          >
                            View Selected Promos
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => setShowPromoModal(true)}
                          >
                            Edit
                          </Button>
                        </div>
                      </Form.Group>
                    )}

                  </div>
                </Form.Group>

              </Col>
            </Row>
          </Form>
          {/* When the user clicks submit, the file will be converted, downloaded, and then the confirmation modal appears */}
          <SubmitButton onClick={handleConvertAndDownload} />
        </Col>
      </Row>
    </Container>
  );
}

export default Upload;
