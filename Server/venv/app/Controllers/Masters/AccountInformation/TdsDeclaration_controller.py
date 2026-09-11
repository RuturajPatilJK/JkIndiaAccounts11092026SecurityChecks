from flask import jsonify, request, send_file
from sqlalchemy import text
from werkzeug.utils import secure_filename
from app import app, db
from app.models.Masters.AccountInformation.TDS_DeclarationModel import TDS_Declaration
from app.utils.CommonGLedgerFunctions import fetch_company_parameters
import mimetypes
import os
import json
import re
import shutil

API_URL = os.getenv('API_URL')



UPLOAD_FOLDER = "Uploads/TDS_Declaration"



# @app.route(API_URL + "/getall-tds-declarations", methods=["GET"])
# def get_all_tds_declarations():

#     try:
#         company_code = request.args.get('company_code')

#         if not company_code:
#             return jsonify({'error': 'company_code is required'}), 400

#         company_code = int(company_code)
#         year_code = request.args.get('year_code')

#         if not year_code:
#             return jsonify({'error': 'year_code is required'}), 400

#         year_code = int(year_code)

#         company_params = fetch_company_parameters(company_code, year_code)

#         print(f"[TDS] company_params = {company_params}")
#         if company_params:
#             print(f"[TDS] defaultSundryCreditors  = {company_params.defaultSundryCreditors}")
#             print(f"[TDS] defalultSundryDebitors  = {company_params.defalultSundryDebitors}")

#         if not company_params:
#             return jsonify({
#                 'error': 'Company parameters not found for given company_code and year_code'
#             }), 404

#         creditors_group = company_params.defaultSundryCreditors
#         debtors_group   = company_params.defalultSundryDebitors

#         if creditors_group is not None and debtors_group is not None:

#             print(f"[TDS] Using group filter: creditors={creditors_group}, debtors={debtors_group}")

#             party_query = text("""
#                 SELECT
#                     CompanyPan,
#                     Ac_Code,
#                     accoid,
#                     Ac_Name_E,
#                     cityname,
#                     Company_Code,
#                     Gst_No,
#                     Group_Code
#                 FROM qrymstaccountmaster
#                 WHERE Company_Code = :company_code
#                   AND Group_Code IN (:creditors_group, :debtors_group)
                               
#             """)

#             party_result = db.session.execute(
#                 party_query,
#                 {
#                     'company_code':    company_code,
#                     'creditors_group': creditors_group,
#                     'debtors_group':   debtors_group,
#                 }
#             )

#         else:

#             print(f"[TDS] WARNING: group codes are None — fetching all parties for company={company_code}")

#             party_query = text("""
#                 SELECT
#                     CompanyPan,
#                     Ac_Code,
#                     accoid,
#                     Ac_Name_E,
#                     cityname,
#                     Company_Code,
#                     Gst_No,
#                     Group_Code
#                 FROM qrymstaccountmaster
#                 WHERE Company_Code = :company_code
#             """)

#             party_result = db.session.execute(
#                 party_query,
#                 {'company_code': company_code}
#             )

#         party_data = []

#         for row in party_result:
#             party_data.append({
#                 "CompanyPan":       row.CompanyPan,
#                 "Ac_Code":      row.Ac_Code,
#                 "accoid":       row.accoid,
#                 "Ac_Name_E":    row.Ac_Name_E,
#                 "cityname":     row.cityname,
#                 "Company_Code": row.Company_Code,
#                 "Gst_No":       row.Gst_No,
#                 "Group_Code":   row.Group_Code,
#             })

#         print(f"[TDS] partyData count = {len(party_data)}")

#         records = TDS_Declaration.query.filter(
#             TDS_Declaration.Company_code == company_code,
#             TDS_Declaration.Year_code    == year_code
#         ).order_by(
#             TDS_Declaration.TDS_declaration_id.desc()
#         ).all()

#         tds_data = []

#         for record in records:
#             row = {
#                 column.key: getattr(record, column.key)
#                 for column in record.__table__.columns
#             }
#             tds_data.append(row)

#         print(f"[TDS] tdsData count = {len(tds_data)}")

#         return jsonify({
#             "success":            True,
#             "partyData":          party_data,
#             "tdsDeclarationData": tds_data,
#         })

#     except Exception as e:
#         print("ERROR :", e)
#         return jsonify({'error': str(e)}), 500


@app.route(API_URL + "/getall-tds-declarations", methods=["GET"])
def get_all_tds_declarations():
    try:
        company_code = request.args.get('company_code')
        if not company_code:
            return jsonify({'error': 'company_code is required'}), 400
        company_code = int(company_code)

        year_code = request.args.get('year_code')
        if not year_code:
            return jsonify({'error': 'year_code is required'}), 400
        year_code = int(year_code)

        # ── fetch group codes from company params ── #
        company_params = fetch_company_parameters(company_code, year_code)

        if not company_params:
            return jsonify({
                'error': 'Company parameters not found for given company_code and year_code'
            }), 404

        creditors_group = company_params.defaultSundryCreditors  # e.g. 4
        debtors_group   = company_params.defalultSundryDebitors  # e.g. 10

        print(f"[TDS] creditors_group={creditors_group}, debtors_group={debtors_group}")

        # ── call SP — pass group codes as params ── #
        sp_query = text("""
            EXEC SPForTDS 
                :company_code, 
                :year_code, 
                :group_code1, 
                :group_code2
        """)

        sp_result = db.session.execute(sp_query, {
            'company_code':  company_code,
            'year_code':     year_code,
            'group_code1':   creditors_group,   # NULL if not set in company_params
            'group_code2':   debtors_group,     # NULL if not set in company_params
        })

        # ── map result ── #
        party_data = []
        for row in sp_result:
            party_data.append({
                "Ac_Code":      row.AcCode,
                "accoid":       row.ac,
                "Ac_Name_E":    row.acname,
                "CompanyPan":   row.Pan,
                "Gst_No":       row.gstno,
                "Group_Code":   row.Groupcode,
                "group_Name_E": row.Groupname,
                "Taxable":      float(row.Taxable) if row.Taxable is not None else 0.0,
                "TDSAmt":       float(row.TDSAmt)  if row.TDSAmt  is not None else 0.0,
            })

        print(f"[TDS] partyData count = {len(party_data)}")

        # ── TDS declaration records ── #
        records = TDS_Declaration.query.filter(
            TDS_Declaration.Company_code == company_code,
            TDS_Declaration.Year_code    == year_code
        ).order_by(
            TDS_Declaration.TDS_declaration_id.desc()
        ).all()

        tds_data = []
        for record in records:
            row = {
                column.key: getattr(record, column.key)
                for column in record.__table__.columns
            }
            tds_data.append(row)

        print(f"[TDS] tdsData count = {len(tds_data)}")

        return jsonify({
            "success":            True,
            "partyData":          party_data,
            "tdsDeclarationData": tds_data,
        })

    except Exception as e:
        print("ERROR :", e)
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/get-tds-declaration/<int:id>", methods=["GET"])
def get_tds_declaration(id):

    try:

        company_code = request.args.get('company_code')
        year_code = request.args.get('year_code')

        record = TDS_Declaration.query.filter(
            TDS_Declaration.TDS_declaration_id == id,
            TDS_Declaration.Company_code == company_code,
            TDS_Declaration.Year_code == year_code
        ).first()

        if not record:

            return jsonify({
                'error': 'Record not found'
            }), 404

        data = {
            column.key: getattr(record, column.key)
            for column in record.__table__.columns
        }

        return jsonify({
            "success": True,
            "data": data
        })

    except Exception as e:

        print(e)

        return jsonify({
            'error': 'Internal server error'
        }), 500


@app.route(API_URL + "/create-tds-declaration", methods=["POST"])
def create_tds_declaration():
    try:


        Ac_code      = request.form.get('Ac_code')
        accoid       = request.form.get('accoid')
        Company_code = request.form.get('Company_code')
        Year_code    = request.form.get('Year_code')
        PANNO        = request.form.get('PANNO')
        belowLimit   = request.form.get('belowLimit')
        Ac_Name_E    = request.form.get('Ac_Name_E', '').strip()
        Gst_No       = request.form.get('Gst_No', '').strip()

        is_tds_uploaded = (
            str(request.form.get('is_tds_uploaded')).strip().lower() == "true"
        )


        if not PANNO and accoid:
            pan_row = db.session.execute(
                text("SELECT CompanyPan FROM qrymstaccountmaster WHERE accoid = :accoid"),
                {'accoid': int(accoid)}
            ).first()
            PANNO = pan_row.CompanyPan if pan_row else None
            print(f"[CREATE] PANNO fetched from DB: {PANNO}")


        file           = request.files.get('file')
        file_path      = None
        company_folder = None
        file_ext       = None
        full_path      = None

        if file:
            company_folder = os.path.join(
                UPLOAD_FOLDER,
                str(Company_code),
                str(Year_code)
            )
            os.makedirs(company_folder, exist_ok=True)

            file_ext = os.path.splitext(file.filename)[1]

            clean_gst = re.sub(r'[\\/:*?"<>|\s]', '_', Gst_No) if Gst_No else ""

            if clean_gst:
                # raw_filename = f"tds_file_{Ac_code}_{clean_gst}{file_ext}"
                raw_filename = f"GST_{clean_gst}{file_ext}"
            else:
                # raw_filename = f"tds_file_{Ac_code}_{Year_code}{file_ext}"
                raw_filename = f"tds_file_{Ac_code}_{Year_code}{file_ext}"


            filename = secure_filename(raw_filename)
            if not filename:
                filename = f"tds_file_{Ac_code}{file_ext}"

            full_path = os.path.join(company_folder, filename)
            file.save(full_path)
            file_path = full_path.replace("\\", "/")

            print(f"[CREATE] file saved : {file_path}")

        new_record = TDS_Declaration(
            Ac_code         = int(Ac_code)      if Ac_code      else None,
            accoid          = int(accoid)        if accoid       else None,
            Company_code    = int(Company_code)  if Company_code else None,
            Year_code       = int(Year_code)     if Year_code    else None,
            PANNO           = PANNO,
            belowLimit      = belowLimit,
            is_tds_uploaded = is_tds_uploaded,
            TDS_file_path   = file_path,
        )

        db.session.add(new_record)
        db.session.commit()
        db.session.refresh(new_record)

        print(f"[CREATE] primary record saved: id={new_record.TDS_declaration_id}, PANNO={PANNO}")


        additional_rows        = []
        additional_accoids_raw = request.form.get('additional_accoids', '[]')

        try:
            additional_accoids = json.loads(additional_accoids_raw)
        except Exception:
            additional_accoids = []

        print(f"[CREATE] additional_accoids = {additional_accoids}")

        for item in additional_accoids:
            try:
                # Skip if no file was uploaded — nothing to copy
                if not full_path or not company_folder:
                    print(f"[CREATE] skipping additional — no file uploaded")
                    break

                add_accoid  = int(item.get('accoid', 0))
                add_ac_code = item.get('Ac_code') or item.get('Ac_Code')

                print(f"[CREATE] processing additional accoid={add_accoid}, Ac_Code={add_ac_code}")

                # ── Fetch PANNO for this additional party from DB ──
                pan_row = db.session.execute(
                    text("SELECT CompanyPan FROM qrymstaccountmaster WHERE accoid = :accoid"),
                    {'accoid': add_accoid}
                ).first()
                add_panno = pan_row.CompanyPan if pan_row else None
                print(f"[CREATE] additional PANNO={add_panno}")

                # ── Build a unique filename for this additional party ──
                # clean_gst_add = re.sub(r'[\\/:*?"<>|\s]', '_', Gst_No) if Gst_No else ""
                # if clean_gst_add:
                #     add_raw = f"tds_file_{add_ac_code}_{clean_gst_add}{file_ext}"
                # else:
                #     add_raw = f"tds_file_{add_ac_code}_{Year_code}{file_ext}"

                # add_filename = secure_filename(add_raw)
                # if not add_filename:
                #     add_filename = f"tds_file_{add_ac_code}{file_ext}"

                # add_full_path = os.path.join(company_folder, add_filename)

                # # Copy the uploaded file to the new path
                # shutil.copy2(full_path, add_full_path)
                # add_file_path = add_full_path.replace("\\", "/")
                # print(f"[CREATE] copied file to: {add_file_path}")


                # Use same common file path
                add_file_path = file_path

                existing = TDS_Declaration.query.filter(
                    TDS_Declaration.accoid       == add_accoid,
                    TDS_Declaration.Company_code == int(Company_code),
                    TDS_Declaration.Year_code    == int(Year_code)
                ).first()

                if existing:
                    existing.TDS_file_path   = add_file_path
                    existing.is_tds_uploaded = True
                    existing.PANNO           = add_panno   # ← fix
                    existing.belowLimit      = belowLimit   # ← carry over
                    db.session.commit()
                    db.session.refresh(existing)
                    add_row = {
                        col.key: getattr(existing, col.key)
                        for col in existing.__table__.columns
                    }
                    print(f"[CREATE] updated existing id={existing.TDS_declaration_id}")
                else:
                    add_rec = TDS_Declaration(
                        Ac_code         = int(add_ac_code) if add_ac_code else None,
                        accoid          = add_accoid,
                        Company_code    = int(Company_code),
                        Year_code       = int(Year_code),
                        PANNO           = add_panno,        # ← fix
                        belowLimit      = belowLimit,        # ← carry over
                        is_tds_uploaded = True,
                        TDS_file_path   = add_file_path,
                    )
                    db.session.add(add_rec)
                    db.session.commit()
                    db.session.refresh(add_rec)
                    add_row = {
                        col.key: getattr(add_rec, col.key)
                        for col in add_rec.__table__.columns
                    }
                    print(f"[CREATE] created new id={add_rec.TDS_declaration_id}")

                additional_rows.append(add_row)

            except Exception as ex:
                import traceback; traceback.print_exc()
                print(f"[CREATE] additional_accoid error: {ex}")

        # ==========================================
        # RETURN RESPONSE
        # ==========================================
        row = {
            column.key: getattr(new_record, column.key)
            for column in new_record.__table__.columns
        }

        print(f"[CREATE] done — additional_rows count={len(additional_rows)}")

        return jsonify({
            "success":         True,
            "message":         "TDS Declaration created successfully",
            "data":            row,
            "additional_data": additional_rows,
        })

    except Exception as e:
        print("ERROR :", e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500



@app.route(API_URL + "/update-tds-declaration/<int:id>",methods=["PUT"])
def update_tds_declaration(id):

    try:

        company_code = request.form.get(
            'Company_code'
        )

        year_code = request.form.get(
            'Year_code'
        )

        record = TDS_Declaration.query.filter(
            TDS_Declaration.TDS_declaration_id == id,
            TDS_Declaration.Company_code == int(
                company_code
            ),
            TDS_Declaration.Year_code == int(
                year_code
            )
        ).first()

        if not record:

            return jsonify({
                'error': 'Record not found'
            }), 404

        record.Ac_code = (
            int(request.form.get('Ac_code'))
            if request.form.get('Ac_code')
            else None
        )

        record.accoid = (
            int(request.form.get('accoid'))
            if request.form.get('accoid')
            else None
        )

        record.Company_code = (
            int(company_code)
            if company_code else None
        )

        record.Year_code = (
            int(year_code)
            if year_code else None
        )

        record.PANNO = request.form.get(
            'PANNO'
        )

        record.belowLimit = request.form.get(
            'belowLimit'
        )

        is_tds_uploaded = request.form.get(
            'is_tds_uploaded'
        )

        record.is_tds_uploaded = (
            str(is_tds_uploaded)
            .strip()
            .lower() == "true"
        )

        remove_file = request.form.get(
            'remove_file'
        )

        gst_no = request.form.get('Gst_No', '').strip()

        if str(remove_file).strip().lower() == "true":

            deleted_ids = []

            same_gst_accoids = []

            if gst_no:

                gst_query = text("""
                    SELECT accoid
                    FROM qrymstaccountmaster
                    WHERE Company_Code = :company_code
                    AND Gst_No = :gst_no
                """)

                gst_result = db.session.execute(gst_query, {
                    'company_code': int(company_code),
                    'gst_no': gst_no
                })

                same_gst_accoids = [
                    int(r.accoid)
                    for r in gst_result
                ]

            # Always include current accoid
            if record.accoid not in same_gst_accoids:
                same_gst_accoids.append(record.accoid)

            print(f"[REMOVE] same_gst_accoids = {same_gst_accoids}")


            records_to_delete = TDS_Declaration.query.filter(
                TDS_Declaration.accoid.in_(same_gst_accoids),
                TDS_Declaration.Company_code == int(company_code),
                TDS_Declaration.Year_code == int(year_code)
            ).all()

            print(f"[REMOVE] records_to_delete = {len(records_to_delete)}")


            for rec in records_to_delete:

                try:

                    if rec.TDS_file_path:

                        file_path = os.path.normpath(rec.TDS_file_path)

                        if os.path.exists(file_path):
                            os.remove(file_path)
                            print(f"[REMOVE] deleted file: {file_path}")

                    deleted_ids.append(rec.TDS_declaration_id)

                    db.session.delete(rec)

                except Exception as ex:
                    print(f"[REMOVE] delete error: {ex}")

            db.session.commit()

            return jsonify({
                "success": True,
                "message": "All GST linked records deleted successfully",
                "deleted": True,
                "deleted_ids": deleted_ids
            })

        file = request.files.get('file')

        if file:

            # Delete old file
            if (
                record.TDS_file_path and
                os.path.exists(
                    record.TDS_file_path
                )
            ):

                os.remove(
                    record.TDS_file_path
                )

            # Create folder
            company_folder = os.path.join(
                UPLOAD_FOLDER,
                str(company_code),
                str(year_code)
            )

            os.makedirs(
                company_folder,
                exist_ok=True
            )

            # File extension
            file_ext = os.path.splitext(
                file.filename
            )[1]

            # Ac_Name_E and Gst_No from form (for filename)
            gst_no = request.form.get('Gst_No', '').strip()

            # Filename: tds_file_{Ac_code}_{Gst_No}.ext
            clean_gst = re.sub(r'[\\/:*?"<>|\s]', '_', gst_no) if gst_no else ""
            if clean_gst:
                
                raw_filename = f"GST_{clean_gst}{file_ext}"
            else:
                raw_filename = f"tds_file_{record.Ac_code}_{year_code}{file_ext}"

            filename = secure_filename(raw_filename)
            if not filename:
                filename = f"tds_file_{record.Ac_code}{file_ext}"

            # Full path
            full_path = os.path.join(
                company_folder,
                filename
            )

            # Save new file
            file.save(full_path)

            # Store DB path
            record.TDS_file_path = (
                full_path.replace("\\", "/")
            )

        # SAVE CHANGES
        db.session.commit()
        db.session.refresh(record)


        additional_rows = []
        if file:  # only apply when a new file was uploaded
            additional_accoids_raw = request.form.get('additional_accoids', '[]')
            try:
                additional_accoids = json.loads(additional_accoids_raw)
            except Exception:
                additional_accoids = []

            for item in additional_accoids:
                try:
                    add_accoid  = int(item.get('accoid', 0))
                    add_ac_code = item.get('Ac_code') or item.get('Ac_Code')

                    # ── Build unique filename for this additional party ──
                    add_gst_no = gst_no  # same GST as primary
                    clean_gst_add = re.sub(r'[\\/:*?"<>|\s]', '_', add_gst_no) if add_gst_no else ""
                    if clean_gst_add:
                        add_raw = f"tds_file_{add_ac_code}_{clean_gst_add}{file_ext}"
                    else:
                        add_raw = f"tds_file_{add_ac_code}_{year_code}{file_ext}"

                    add_filename = secure_filename(add_raw)
                    if not add_filename:
                        add_filename = f"tds_file_{add_ac_code}{file_ext}"

                    add_full_path = os.path.join(company_folder, add_filename)

                    # Copy the file
                    add_file_path = record.TDS_file_path

                    existing = TDS_Declaration.query.filter(
                        TDS_Declaration.accoid       == add_accoid,
                        TDS_Declaration.Company_code == int(company_code),
                        TDS_Declaration.Year_code    == int(year_code)
                    ).first()

                    if existing:
                        existing.TDS_file_path   = add_file_path
                        existing.is_tds_uploaded = True
                        db.session.commit()
                        db.session.refresh(existing)
                        add_row = {
                            col.key: getattr(existing, col.key)
                            for col in existing.__table__.columns
                        }
                    else:
                        add_rec = TDS_Declaration(
                            Ac_code         = int(add_ac_code) if add_ac_code else None,
                            accoid          = add_accoid,
                            Company_code    = int(company_code),
                            Year_code       = int(year_code),
                            is_tds_uploaded = True,
                            TDS_file_path   = add_file_path,
                        )
                        db.session.add(add_rec)
                        db.session.commit()
                        db.session.refresh(add_rec)
                        add_row = {
                            col.key: getattr(add_rec, col.key)
                            for col in add_rec.__table__.columns
                        }

                    additional_rows.append(add_row)
                except Exception as ex:
                    import traceback; traceback.print_exc()
                    print(f"[UPDATE] additional_accoid error: {ex}")

        row = {
            column.key: getattr(record, column.key)
            for column in record.__table__.columns
        }

        return jsonify({
            "success":         True,
            "message":         "TDS Declaration updated successfully",
            "data":            row,
            "additional_data": additional_rows,
        })

    except Exception as e:

        print("ERROR :", e)

        return jsonify({
            'error': str(e)
        }), 500

@app.route(API_URL + "/delete-tds-declaration/<int:id>",methods=["DELETE"]
)
def delete_tds_declaration(id):

    try:

        company_code = request.args.get(
            'company_code'
        )

        year_code = request.args.get(
            'year_code'
        )

        record = TDS_Declaration.query.filter(
            TDS_Declaration.TDS_declaration_id == id,
            TDS_Declaration.Company_code == int(company_code),
            TDS_Declaration.Year_code == int(year_code)
        ).first()

        if not record:

            return jsonify({
                'error': 'Record not found'
            }), 404

        if record.TDS_file_path:

            file_path = record.TDS_file_path

            # Windows/Linux path fix
            file_path = os.path.normpath(
                file_path
            )

            print("FILE PATH :", file_path)

            # Check file exists
            if os.path.exists(file_path):

                os.remove(file_path)

                print("FILE DELETED")

            else:

                print("FILE NOT FOUND")

        db.session.delete(record)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Record and file deleted successfully"
        })

    except Exception as e:

        print("ERROR :", e)

        return jsonify({
            'error': str(e)
        }), 500

@app.route(API_URL + "/preview-tds-document/<int:id>", methods=["GET"])
def preview_tds_document(id):
    try:
        record = TDS_Declaration.query.filter(
            TDS_Declaration.TDS_declaration_id == id
        ).first()

        if not record:
            return jsonify({'error': 'Record not found'}), 404

        if not record.TDS_file_path:
            return jsonify({'error': 'No file attached'}), 404

        raw_path = record.TDS_file_path
        clean_path = raw_path.replace("\\", "/")

        if os.path.isabs(clean_path):
            file_path = os.path.normpath(clean_path)
        else:
            file_path = os.path.normpath(
                os.path.join(os.getcwd(), clean_path)
            )

        print(f"[PREVIEW] resolved path : {file_path}")
        print(f"[PREVIEW] file exists   : {os.path.exists(file_path)}")

        # ── Fallback: if exact file not found, search folder by Ac_code ──
        if not os.path.exists(file_path):
            folder = os.path.dirname(file_path)
            print(f"[PREVIEW] exact file missing, searching folder: {folder}")

            if os.path.exists(folder):
                ac_code = str(record.Ac_code)
                # Find any file starting with Ac_code
                matches = [
                    f for f in os.listdir(folder)
                    if f.startswith(ac_code + "_") or f.startswith("tds_file_" + ac_code + "_")
                ]
                print(f"[PREVIEW] fallback matches: {matches}")

                if matches:
                    file_path = os.path.join(folder, matches[0])
                    # Update DB path to correct filename
                    new_db_path = os.path.join(
                        os.path.dirname(raw_path), matches[0]
                    ).replace("\\", "/")
                    record.TDS_file_path = new_db_path
                    db.session.commit()
                    print(f"[PREVIEW] DB path updated to: {new_db_path}")
                else:
                    return jsonify({
                        'error': 'File not found on disk',
                        'raw_db_path': raw_path,
                        'folder_contents': os.listdir(folder),
                    }), 404
            else:
                return jsonify({'error': 'Upload folder not found'}), 404

        mime_type, _ = mimetypes.guess_type(file_path)
        mime_type = mime_type or 'application/octet-stream'

        return send_file(
            file_path,
            mimetype=mime_type,
            as_attachment=False,
            download_name=os.path.basename(file_path)
        )

    except Exception as e:
        import traceback
        print("PREVIEW ERROR:", e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@app.route(API_URL + "/check-pan-duplicates", methods=["GET"])
def check_pan_duplicates():
    try:
        company_code = request.args.get('company_code')
        year_code    = request.args.get('year_code')

        if not company_code or not year_code:
            return jsonify({'error': 'company_code and year_code are required'}), 400

        company_code = int(company_code)
        year_code    = int(year_code)

        # ── Step 1: Fetch all accounts grouped by PAN (single query) ──
        query = text("""
            SELECT Ac_Code, accoid, Ac_Name_E, cityname, CompanyPan
            FROM qrymstaccountmaster
            WHERE Company_Code = :company_code
              AND CompanyPan IS NOT NULL
              AND CompanyPan != ''
        """)
        result = db.session.execute(query, {'company_code': company_code})

        pan_groups = {}
        all_accoids = []

        for row in result:
            pan = row.CompanyPan.strip().upper()
            if pan not in pan_groups:
                pan_groups[pan] = []
            pan_groups[pan].append({
                'Ac_Code':    row.Ac_Code,
                'accoid':     row.accoid,
                'Ac_Name_E':  row.Ac_Name_E,
                'cityname':   row.cityname,
                'CompanyPan': row.CompanyPan,
            })
            all_accoids.append(row.accoid)

        # Only keep PANs shared by more than 1 account
        duplicate_pan_groups = {
            pan: parties
            for pan, parties in pan_groups.items()
            if len(parties) >= 2
        }

        if not duplicate_pan_groups:
            return jsonify({'success': True, 'duplicates': [], 'total_pan_groups': 0})

        # ── Step 2: Fetch ALL TDS records for duplicate accoids in ONE query ──
        duplicate_accoids = [
            p['accoid']
            for parties in duplicate_pan_groups.values()
            for p in parties
        ]

        existing_records = TDS_Declaration.query.filter(
            TDS_Declaration.accoid.in_(duplicate_accoids),
            TDS_Declaration.Company_code == company_code,
            TDS_Declaration.Year_code    == year_code
        ).all()

        # Build a lookup dict: accoid → TDS record
        tds_map = {r.accoid: r for r in existing_records}

        # ── Step 3: Build response using the lookup (no DB calls in loop) ──
        duplicates = []
        for pan, parties in duplicate_pan_groups.items():
            party_list = []
            for p in parties:
                existing = tds_map.get(p['accoid'])
                party_list.append({
                    'Ac_Code':            p['Ac_Code'],
                    'accoid':             p['accoid'],
                    'Ac_Name_E':          p['Ac_Name_E'],
                    'cityname':           p['cityname'],
                    'CompanyPan':         p['CompanyPan'],
                    'has_record':         existing is not None,
                    'has_file':           bool(existing and existing.TDS_file_path),
                    'TDS_declaration_id': existing.TDS_declaration_id if existing else None,
                })

            duplicates.append({
                'pan_no':  pan,
                'count':   len(party_list),
                'parties': party_list,
            })

        return jsonify({
            'success':          True,
            'duplicates':       duplicates,
            'total_pan_groups': len(duplicates),
        })

    except Exception as e:
        print("ERROR check-pan-duplicates:", e)
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + "/tds-declaration-status", methods=["GET"])
def tds_declaration_status():
    """
    Check if a TDS declaration with an uploaded file exists for a given account.
    Used by the Account Master form to show/hide the TDS certificate badge.
    """
    try:
        ac_code      = request.args.get('ac_code')
        company_code = request.args.get('company_code')
        year_code    = request.args.get('year_code')

        if not all([ac_code, company_code, year_code]):
            return jsonify({'error': 'ac_code, company_code, year_code are required'}), 400

        record = TDS_Declaration.query.filter(
            TDS_Declaration.Ac_code      == int(ac_code),
            TDS_Declaration.Company_code == int(company_code),
            TDS_Declaration.Year_code    == int(year_code)
        ).first()

        if not record or not record.TDS_file_path:
            return jsonify({'success': True, 'has_file': False})

        return jsonify({
            'success':             True,
            'has_file':            True,
            'TDS_declaration_id':  record.TDS_declaration_id,
            'file_name':           record.TDS_file_path.split('/')[-1],
        })

    except Exception as e:
        print("ERROR [tds-declaration-status]:", e)
        return jsonify({'error': str(e)}), 500


    