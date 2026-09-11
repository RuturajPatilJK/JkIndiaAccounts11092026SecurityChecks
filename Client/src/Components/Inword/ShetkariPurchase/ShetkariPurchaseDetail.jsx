import React from "react";
import { Grid, FormControl, InputLabel, TextField } from "@mui/material";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import BrandMasterHelp from "../../../Helper/BrandMasterHelp";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";

const ShetkariPurchaseDetail = ({
  show,
  onClose,
  selectedUser,
  formDataDetail,
  handleChangeDetail,
  handleItemSelect,
  handleBrandCode,
  handleGstCode,
  gstCode,
  GSTNameLabel,
  itemNameLabel,
  itemSelect,
  BrandNameLabel,
  brandCode,
  addUser,
  updateUser,
  isEditing,
  addOneButtonEnabled,
  firstInputRef,
  handleKeyDownDetail
}) => {
  if (!show) return null;

  return (
    <div className="sugar-purchase-modal" >
      <div className="sugar-purchase-modal-dialog" >
        <div className="sugar-purchase-modal-content">
          <div className="sugar-purchase-modal-header">
            <h5 className="sugar-purchase-modal-title">
              {selectedUser.id ? "Update Shetkari Purchase" : "Add Shetkari Purchase"}
            </h5>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: "40px",
                height: "45px",
                borderRadius: "4px"
              }}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="sugar-purchase-body">
            <form>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <div className="SugarPurchaseBill-row">
                    <label htmlFor="Item_Select" className="SugarPurchaseBilllabel" >
                      Item Name :
                    </label>
                    <div >
                      <div style={{ marginLeft: "10px" }}>
                        <SystemHelpMaster
                          onAcCodeClick={handleItemSelect}
                          CategoryName={itemNameLabel}
                          CategoryCode={itemSelect}
                          name="Item_Select"
                          SystemType="I"
                          firstInputRef={firstInputRef}
                          onKeyDown={handleKeyDownDetail}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="SugarPurchaseBill-row">
                    <label htmlFor="Brand_Code" className="SugarPurchaseBilllabel" >
                      Brand Code :
                    </label>
                    <div >
                      <div >
                        <BrandMasterHelp
                          onAcCodeClick={handleBrandCode}
                          brandName={BrandNameLabel}
                          brandCode={brandCode}
                          name="Brand_Code"

                        />
                      </div>
                    </div>
                  </div>
                </Grid>
              </Grid>
              <Grid container spacing={2} mt={2}>
                <Grid item xs={2}>
                  <TextField
                    id="Qty"
                    type="text"
                    label="Qty"
                    fullWidth
                    size="small"
                    name="Qty"
                    autoComplete="off"
                    value={formDataDetail.Qty}
                    onChange={handleChangeDetail}
                    onKeyDown={handleKeyDownDetail}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Wt_Per"
                    type="text"
                    label="Wt_Per"
                    fullWidth
                    size="small"
                    name="Wt_Per"
                    autoComplete="off"
                    value={formDataDetail.Wt_Per}
                    onChange={handleChangeDetail}
                    onKeyDown={handleKeyDownDetail}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Wt_Qty"
                    label="Wt_Qty"
                    type="text"
                    fullWidth
                    size="small"
                    name="Wt_Qty"
                    autoComplete="off"
                    value={formDataDetail.Wt_Qty}
                    onChange={handleChangeDetail}
                    onKeyDown={handleKeyDownDetail}
                    disabled
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Net_wt"
                    type="text"
                    label="less Wt"
                    fullWidth
                    size="small"
                    name="Net_wt"
                    autoComplete="off"
                    value={formDataDetail.Net_wt}
                    onChange={handleChangeDetail}
                    onKeyDown={handleKeyDownDetail}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Rate"
                    type="text"
                    label="Rate"
                    fullWidth
                    size="small"
                    name="Rate"
                    autoComplete="off"
                    value={formDataDetail.Rate || ""}
                    onChange={handleChangeDetail}
                    onKeyDown={handleKeyDownDetail}
                  />
                </Grid>

                <Grid item xs={2}>

                  <TextField
                    id="Value"
                    type="text"
                    label="Value"
                    fullWidth
                    size="small"
                    name="Value"
                    autoComplete="off"
                    value={formDataDetail.Value}
                    onChange={handleChangeDetail}
                    disabled

                  />
                </Grid>
                <div style={{ display: "flex", alignItems: "center" }}>


                  <label
                    htmlFor="Bill_From"
                    style={{
                      fontWeight: "bold",

                      whiteSpace: "nowrap",
                      marginLeft: "14px"
                    }}
                  >
                    GST Code:
                  </label>

                  <div >
                    <GSTRateMasterHelp
                      onAcCodeClick={handleGstCode}
                      name="GST_Code"
                      GstRateName={GSTNameLabel}
                      GstRateCode={gstCode || formDataDetail.GST_Code}

                      disabledFeild={!isEditing && addOneButtonEnabled}
                      onChange={(value) => handleChangeDetail({
                        target: {
                          name: "GstRateCode",
                          value: value
                        }
                      })}
                    />
                  </div>
                </div>
                <Grid item xs={2}>
                  <TextField
                    id="CGST"
                    type="text"
                    label="CGST"
                    fullWidth
                    size="small"
                    name="CGST"
                    autoComplete="off"
                    value={formDataDetail.CGST}
                    onChange={handleChangeDetail}
                    disabled

                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="SGST"
                    type="text"
                    label="SGST"
                    fullWidth
                    size="small"
                    name="SGST"
                    autoComplete="off"
                    value={formDataDetail.SGST}
                    onChange={handleChangeDetail}
                    disabled

                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="IGST"
                    type="text"
                    label="IGST"
                    fullWidth
                    size="small"
                    name="IGST"
                    autoComplete="off"
                    value={formDataDetail.IGST}
                    onChange={handleChangeDetail}
                    disabled

                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Hamali_Rate"
                    type="text"
                    label="Other Rate"
                    fullWidth
                    size="small"
                    name="Hamali_Rate"
                    autoComplete="off"
                    value={formDataDetail.Hamali_Rate}
                    onChange={handleChangeDetail}
                    onKeyDown={handleKeyDownDetail}

                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Hamali"
                    type="text"
                    label="Other Amount"
                    fullWidth
                    size="small"
                    name="Hamali"
                    autoComplete="off"
                    value={formDataDetail.Hamali}
                    onChange={handleChangeDetail}
                    onKeyDown={handleKeyDownDetail}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="FrieghtperqntlDetail"
                    type="text"
                    label="FrieghtperqntlDetail Amount"
                    fullWidth
                    size="small"
                    name="FrieghtperqntlDetail"
                    autoComplete="off"
                    value={formDataDetail.FrieghtperqntlDetail}
                    onChange={handleChangeDetail}
                    onKeyDown={handleKeyDownDetail}
                  />
                </Grid>

              </Grid>
            </form>
          </div>
          <div style={{
            marginTop: "20px",
            justifyContent: "flex-end",
          }}>
            {selectedUser.id ? (
              <DetailUpdateButton updateUser={updateUser} />
            ) : (
              <DetailAddButtom addUser={addUser} />
            )}
            <DetailCloseButton closePopup={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShetkariPurchaseDetail;