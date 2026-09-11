import React from "react";
import { Grid, FormControl, InputLabel, TextField } from "@mui/material";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import BrandMasterHelp from "../../../Helper/BrandMasterHelp";
import DetailAddButtom from "../../../Common/Buttons/DetailAddButton";
import DetailUpdateButton from "../../../Common/Buttons/DetailUpdateButton";
import DetailCloseButton from "../../../Common/Buttons/DetailCloseButton";

const SugarPurchaseDetail = ({
  show,
  onClose,
  selectedUser,
  formDataDetail,
  handleChangeDetail,
  handleItemSelect,
  handleBrandCode,
  itemNameLabel,
  itemSelect,
  brandName,
  brandCode,
  addUser,
  updateUser,
  isEditing,
  addOneButtonEnabled,
  firstInputRef
}) => {
  if (!show) return null;

  return (
    <div className="sugar-purchase-modal" >
      <div className="sugar-purchase-modal-dialog" >
        <div className="sugar-purchase-modal-content">
          <div className="sugar-purchase-modal-header">
            <h5 className="sugar-purchase-modal-title">
              {selectedUser.id ? "Update Sugar Purchase" : "Add Sugar Purchase"}
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
                      <div style={{marginLeft:"10px"}}>
                        <SystemHelpMaster
                          onAcCodeClick={handleItemSelect}
                          CategoryName={itemNameLabel}
                          CategoryCode={itemSelect}
                          name="Item_Select"
                          SystemType="I"
                          firstInputRef={firstInputRef}
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
                          CategoryName={brandName}
                          CategoryCode={brandCode}
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
                    id="Quantal"
                    type="text"
                    label="Quintal"
                    fullWidth
                    size="small"
                    name="Quantal"
                    autoComplete="off"
                    value={formDataDetail.Quantal}
                    onChange={handleChangeDetail}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Packing"
                    type="text"
                    label="Packing"
                    fullWidth
                    size="small"
                    name="packing"
                    autoComplete="off"
                    value={formDataDetail.packing}
                    onChange={handleChangeDetail}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Bags"
                    label="Bags"
                    type="text"
                    fullWidth
                    size="small"
                    name="bags"
                    autoComplete="off"
                    value={formDataDetail.bags}
                    onChange={handleChangeDetail}
                    disabled
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2} mt={2} >
                <Grid item xs={2}>
                  <TextField
                    id="Rate"
                    type="text"
                    label="Rate"
                    fullWidth
                    size="small"
                    name="rate"
                    autoComplete="off"
                    value={formDataDetail.rate || ""}
                    onChange={handleChangeDetail}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    id="Item Amount"
                    type="text"
                    label="Item Amount"
                    fullWidth
                    size="small"
                    name="item_Amount"
                    autoComplete="off"
                    value={formDataDetail.item_Amount}
                    onChange={handleChangeDetail}
                    disabled
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    id="Narration"
                    name="narration"
                    label="Narration"
                    value={formDataDetail.narration}
                    onChange={handleChangeDetail}
                    autoComplete="off"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    disabled={!isEditing && addOneButtonEnabled}
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

export default SugarPurchaseDetail;