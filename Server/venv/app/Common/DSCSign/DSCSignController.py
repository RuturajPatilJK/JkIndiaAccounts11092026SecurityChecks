# from app import app
# from flask import request, send_file, jsonify
# import os
# import io
# import pathlib

# from pyhanko.sign import signers, fields
# from pyhanko.sign.fields import SigFieldSpec
# from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
# from pyhanko.pdf_utils.images import PdfImage
# from pyhanko.pdf_utils.layout import SimpleBoxLayoutRule, AxisAlignment
# from pyhanko import stamp
# from pyhanko.pdf_utils import text

# API_URL = os.getenv('API_URL')

# DSC_P12_PATH = os.getenv('DSC_P12_PATH') or str(
#     pathlib.Path(__file__).parent.joinpath('dsc_certificate.p12')
# )
# DSC_CERT_PASSWORD = os.getenv('DSC_CERT_PASSWORD')


# _SIGNATURE_IMAGE_PATH = str(pathlib.Path(__file__).parent.joinpath('director_sign.png'))

# _signer_cache = None


# _DEFAULT_BOX = (300, 30, 570, 150)


# _DN_SHORT_NAMES = {
#     'country_name': 'c',
#     'state_or_province_name': 'st',
#     'locality_name': 'l',
#     'organization_name': 'o',
#     'organizational_unit_name': 'ou',
#     'common_name': 'cn',
#     'street_address': 'street',
#     'postal_code': 'postalCode',
#     'serial_number': 'serialNumber',
#     'title': 'title',
#     'pseudonym': 'pseudonym',
#     'domain_component': 'dc',
#     'email_address': 'emailAddress',
# }


# def _format_subject_dn(cert):
#     parts = []
#     for rdn in cert.subject.chosen:
#         for type_and_value in rdn:
#             oid = type_and_value['type']
#             label = _DN_SHORT_NAMES.get(oid.native, oid.dotted)
#             parts.append(f"{label}={type_and_value['value'].native}")
#     return ", ".join(parts)


# def _get_box(form):
#     try:
#         return (
#             float(form['box_x1']),
#             float(form['box_y1']),
#             float(form['box_x2']),
#             float(form['box_y2']),
#         )
#     except (KeyError, TypeError, ValueError):
#         return _DEFAULT_BOX


# def _get_signer():
#     global _signer_cache
#     if _signer_cache is not None:
#         return _signer_cache

#     if not os.path.exists(DSC_P12_PATH):
#         raise FileNotFoundError(
#             f"DSC certificate not found at {DSC_P12_PATH}. "
#             "Set DSC_P12_PATH in .env or place the .p12 file at this location."
#         )

#     loaded = signers.SimpleSigner.load_pkcs12(
#         pfx_file=DSC_P12_PATH,
#         passphrase=DSC_CERT_PASSWORD.encode() if DSC_CERT_PASSWORD else None,
#     )
#     if loaded is None:
#         raise ValueError(
#             "Could not load the DSC certificate - DSC_CERT_PASSWORD in .env "
#             "is likely wrong for this .p12 file (or the file is corrupt)."
#         )
#     _signer_cache = loaded
#     return _signer_cache


# @app.route(API_URL + '/sign-customized-sale-bill-dsc', methods=['POST'])
# def sign_customized_sale_bill_dsc():
#     if 'pdf' not in request.files:
#         return jsonify({'error': 'No PDF file provided under field "pdf"'}), 400

#     pdf_bytes = request.files['pdf'].read()
#     if not pdf_bytes:
#         return jsonify({'error': 'Empty PDF file'}), 400

#     try:
#         signer = _get_signer()
#     except Exception as e:
#         return jsonify({'error': f'DSC not available on server: {str(e)}'}), 500

#     try:
#         writer = IncrementalPdfFileWriter(io.BytesIO(pdf_bytes))

#         box = _get_box(request.form)
#         fields.append_signature_field(
#             writer,
#             SigFieldSpec(sig_field_name='DSCSignature', box=box),
#         )

#         signature_meta = signers.PdfSignatureMetadata(
#             field_name='DSCSignature',
#             reason='Sale Bill Authorization',
#             location='India',
#         )

#         cn = signer.signing_cert.subject.native.get('common_name') or 'Authorised Signatory'
#         dn = _format_subject_dn(signer.signing_cert)

#         background = None
#         if os.path.exists(_SIGNATURE_IMAGE_PATH):
#             background = PdfImage(_SIGNATURE_IMAGE_PATH)

#         stamp_style = stamp.TextStampStyle(
#             stamp_text=f'Digitally signed by {cn}\nDN: {dn}\nDate: %(ts)s',
#             text_box_style=text.TextBoxStyle(font_size=6),
#             background=background,
#             background_opacity=0.45,
#             background_layout=SimpleBoxLayoutRule(
#                 x_align=AxisAlignment.ALIGN_MIN,
#                 y_align=AxisAlignment.ALIGN_MID,
#             ),
#         )

#         pdf_signer = signers.PdfSigner(
#             signature_meta,
#             signer=signer,
#             stamp_style=stamp_style,
#         )

#         out_buf = io.BytesIO()
#         pdf_signer.sign_pdf(writer, output=out_buf)
#         out_buf.seek(0)
#     except Exception as e:
#         return jsonify({'error': f'Signing failed: {str(e)}'}), 500

#     return send_file(
#         out_buf,
#         mimetype='application/pdf',
#         as_attachment=False,
#         download_name='sale_bill_signed.pdf',
#     )














# from app import app
# from flask import request, send_file, jsonify
# import os
# import io
# import textwrap
# import pathlib
# from datetime import datetime

# from pyhanko.sign import signers, fields
# from pyhanko.sign.fields import SigFieldSpec
# from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
# from pyhanko.pdf_utils.images import PdfImage
# from pyhanko import stamp
# from pyhanko.pdf_utils import text

# from PIL import Image, ImageDraw, ImageFont, ImageChops
# from pyhanko.pdf_utils.generic import NameObject, ArrayObject, NumberObject

# API_URL = os.getenv('API_URL')

# DSC_P12_PATH = os.getenv('DSC_P12_PATH') or str(
#     pathlib.Path(__file__).parent.joinpath('dsc_certificate.p12')
# )
# DSC_CERT_PASSWORD = os.getenv('DSC_CERT_PASSWORD')

# _SIGNATURE_IMAGE_PATH = str(pathlib.Path(__file__).parent.joinpath('director_sign.png'))

# # Fonts - DejaVu is preinstalled on most Linux servers.
# # If your server doesn't have these paths: apt-get install fonts-dejavu-core
# _FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
# _FONT_REGULAR_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# _signer_cache = None

# # Box in PDF points (x1, y1, x2, y2). Wide box like Adobe's default appearance.
# _DEFAULT_BOX = (280, 20, 570, 140)

# # Render the composite appearance at higher pixel density for crispness,
# # then let pyHanko scale it down into the PDF box.
# _RENDER_SCALE = 4  # px per pt


# _DN_SHORT_NAMES = {
#     'country_name': 'c',
#     'state_or_province_name': 'st',
#     'locality_name': 'l',
#     'organization_name': 'o',
#     'organizational_unit_name': 'ou',
#     'common_name': 'cn',
#     'street_address': 'street',
#     'postal_code': 'postalCode',
#     'serial_number': 'serialNumber',
#     'title': 'title',
#     'pseudonym': 'pseudonym',
#     'domain_component': 'dc',
#     'email_address': 'emailAddress',
# }


# def _format_subject_dn(cert):
#     parts = []
#     for rdn in cert.subject.chosen:
#         for type_and_value in rdn:
#             oid = type_and_value['type']
#             label = _DN_SHORT_NAMES.get(oid.native, oid.dotted)
#             parts.append(f"{label}={type_and_value['value'].native}")
#     return parts  # list of "key=value" strings, one per DN component


# def _get_box(form):
#     try:
#         return (
#             float(form['box_x1']),
#             float(form['box_y1']),
#             float(form['box_x2']),
#             float(form['box_y2']),
#         )
#     except (KeyError, TypeError, ValueError):
#         return _DEFAULT_BOX


# def _get_signer():
#     global _signer_cache
#     if _signer_cache is not None:
#         return _signer_cache

#     if not os.path.exists(DSC_P12_PATH):
#         raise FileNotFoundError(
#             f"DSC certificate not found at {DSC_P12_PATH}. "
#             "Set DSC_P12_PATH in .env or place the .p12 file at this location."
#         )

#     loaded = signers.SimpleSigner.load_pkcs12(
#         pfx_file=DSC_P12_PATH,
#         passphrase=DSC_CERT_PASSWORD.encode() if DSC_CERT_PASSWORD else None,
#     )
#     if loaded is None:
#         raise ValueError(
#             "Could not load the DSC certificate - DSC_CERT_PASSWORD in .env "
#             "is likely wrong for this .p12 file (or the file is corrupt)."
#         )
#     _signer_cache = loaded
#     return _signer_cache


# def _build_adobe_style_appearance(cn, dn_lines, date_str, box_pt):
#     """
#     Composes one PNG that looks like Adobe's default digital-signature
#     appearance: large CN on the left, small DN/date block on the right,
#     with the signature scrawl overlaid semi-transparently across both.
#     Returns a PIL Image (RGBA) sized to match box_pt's aspect ratio.
#     """
#     x1, y1, x2, y2 = box_pt
#     box_w_pt = x2 - x1
#     box_h_pt = y2 - y1

#     w = int(box_w_pt * _RENDER_SCALE)
#     h = int(box_h_pt * _RENDER_SCALE)

#     img = Image.new("RGBA", (w, h), (255, 255, 255, 0))
#     draw = ImageDraw.Draw(img)

#     try:
#         big_font = ImageFont.truetype(_FONT_BOLD_PATH, int(h * 0.13))
#         small_font = ImageFont.truetype(_FONT_REGULAR_PATH, int(h * 0.045))
#     except OSError:
#         # Fallback if DejaVu isn't installed on this server
#         big_font = ImageFont.load_default()
#         small_font = ImageFont.load_default()

#     left_col_w = int(w * 0.55)

#     # --- Left: big wrapped CN text ---
#     wrap_width = max(10, int(left_col_w / (big_font.size * 0.55)))
#     wrapped_lines = textwrap.wrap(cn, width=wrap_width)
#     line_h = int(big_font.size * 1.15)
#     y = int(h * 0.05)
#     for line in wrapped_lines:
#         draw.text((int(w * 0.02), y), line, font=big_font, fill=(15, 15, 15, 255))
#         y += line_h

#     # --- Right: small DN/date block ---
#     right_x = left_col_w + int(w * 0.02)
#     small_line_h = int(small_font.size * 1.3)
#     y2_cursor = int(h * 0.04)

#     header_lines = [f"Digitally signed by {cn}"] + dn_lines + [f"Date: {date_str}"]
#     for line in header_lines:
#         col_wrap = max(10, int((w - right_x) / (small_font.size * 0.55)))
#         for sub in (textwrap.wrap(line, width=col_wrap) or [line]):
#             draw.text((right_x, y2_cursor), sub, font=small_font, fill=(0, 0, 160, 255))
#             y2_cursor += small_line_h

#     # --- Overlay signature scrawl across the whole box, preserving aspect ratio ---
#     if os.path.exists(_SIGNATURE_IMAGE_PATH):
#         sig = Image.open(_SIGNATURE_IMAGE_PATH).convert("RGBA")
#         sig_ratio = sig.width / sig.height
#         box_ratio = w / h
#         if sig_ratio > box_ratio:
#             new_w = w
#             new_h = int(w / sig_ratio)
#         else:
#             new_h = h
#             new_w = int(h * sig_ratio)
#         sig = sig.resize((new_w, new_h))
#         r, g, b, a = sig.split()
#         a = a.point(lambda p: int(p * 0.55))  # semi-transparent, like Adobe's pink overlay
#         sig.putalpha(a)
#         paste_x = (w - new_w) // 2
#         paste_y = (h - new_h) // 2
#         img.alpha_composite(sig, (paste_x, paste_y))

#     # Return the PIL Image object itself - PdfImage() expects an Image
#     # (it reads .width/.height directly), not raw PNG bytes.
#     return img


# @app.route(API_URL + '/sign-customized-sale-bill-dsc', methods=['POST'])
# def sign_customized_sale_bill_dsc():
#     if 'pdf' not in request.files:
#         return jsonify({'error': 'No PDF file provided under field "pdf"'}), 400

#     pdf_bytes = request.files['pdf'].read()
#     if not pdf_bytes:
#         return jsonify({'error': 'Empty PDF file'}), 400

#     try:
#         signer = _get_signer()
#     except Exception as e:
#         return jsonify({'error': f'DSC not available on server: {str(e)}'}), 500

#     try:
#         writer = IncrementalPdfFileWriter(io.BytesIO(pdf_bytes))

#         box = _get_box(request.form)
#         fields.append_signature_field(
#             writer,
#             SigFieldSpec(sig_field_name='DSCSignature', box=box),
#         )

#         # Force the widget annotation's own border off. This is separate
#         # from the stamp appearance border (already 0 via border_width=0
#         # below) - PDF viewers draw a default rectangle around form-field
#         # widgets unless /Border and /MK are explicitly cleared.
#         acro_fields = writer.root['/AcroForm']['/Fields']
#         sig_annot = acro_fields[-1].get_object()
#         sig_annot[NameObject('/Border')] = ArrayObject(
#             [NumberObject(0), NumberObject(0), NumberObject(0)]
#         )
#         if NameObject('/MK') in sig_annot:
#             del sig_annot[NameObject('/MK')]
#         if NameObject('/BS') in sig_annot:
#             bs = sig_annot[NameObject('/BS')].get_object()
#             bs[NameObject('/W')] = NumberObject(0)

#         signature_meta = signers.PdfSignatureMetadata(
#             field_name='DSCSignature',
#             reason='Sale Bill Authorization',
#             location='India',
#         )

#         cn = signer.signing_cert.subject.native.get('common_name') or 'Authorised Signatory'
#         dn_lines = _format_subject_dn(signer.signing_cert)
#         date_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

#         appearance_img = _build_adobe_style_appearance(cn, dn_lines, date_str, box)
#         background = PdfImage(appearance_img)

#         # stamp_text left blank - our composed PNG already contains ALL the
#         # visible text (CN + DN + date), so pyHanko draws nothing extra.
#         stamp_style = stamp.TextStampStyle(
#             stamp_text=' ',
#             text_box_style=text.TextBoxStyle(font_size=1),
#             background=background,
#             background_opacity=1.0,
#             border_width=0,
#         )

#         pdf_signer = signers.PdfSigner(
#             signature_meta,
#             signer=signer,
#             stamp_style=stamp_style,
#         )

#         out_buf = io.BytesIO()
#         pdf_signer.sign_pdf(writer, output=out_buf)
#         out_buf.seek(0)
#     except Exception as e:
#         return jsonify({'error': f'Signing failed: {str(e)}'}), 500

#     return send_file(
#         out_buf,
#         mimetype='application/pdf',
#         as_attachment=False,
#         download_name='sale_bill_signed.pdf',
#     )












from app import app
from flask import request, send_file, jsonify
import os
import io
import textwrap
import pathlib
from datetime import datetime
from zoneinfo import ZoneInfo

from pyhanko.sign import signers, fields
from pyhanko.sign.fields import SigFieldSpec
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.pdf_utils.images import PdfImage
from pyhanko import stamp
from pyhanko.pdf_utils import text

from PIL import Image, ImageDraw, ImageFont, ImageChops
from pyhanko.pdf_utils.generic import NameObject, ArrayObject, NumberObject

API_URL = os.getenv('API_URL')

# Signature timestamp is always shown in IST, regardless of the server's own
# timezone setting (e.g. a host configured for UTC).
_IST = ZoneInfo('Asia/Kolkata')

DSC_P12_PATH = os.getenv('DSC_P12_PATH') or str(
    pathlib.Path(__file__).parent.joinpath('dsc_certificate.p12')
)
DSC_CERT_PASSWORD = os.getenv('DSC_CERT_PASSWORD')

_SIGNATURE_IMAGE_PATH = str(pathlib.Path(__file__).parent.joinpath('director_sign.png'))

# Fonts - bundled next to this script so it works regardless of OS
# (Windows dev machine, Linux server, etc). Download these two files and
# place them in the SAME folder as this script:
#   https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf
#   https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf
_BUNDLED_FONT_BOLD = str(pathlib.Path(__file__).parent.joinpath('DejaVuSans-Bold.ttf'))
_BUNDLED_FONT_REGULAR = str(pathlib.Path(__file__).parent.joinpath('DejaVuSans.ttf'))

# Fallback system paths if the bundled files aren't there yet
_FONT_BOLD_CANDIDATES = [
    _BUNDLED_FONT_BOLD,
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",   # Linux
    "C:\\Windows\\Fonts\\arialbd.ttf",                        # Windows
    "/Library/Fonts/Arial Bold.ttf",                          # macOS
]
_FONT_REGULAR_CANDIDATES = [
    _BUNDLED_FONT_REGULAR,
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",        # Linux
    "C:\\Windows\\Fonts\\arial.ttf",                          # Windows
    "/Library/Fonts/Arial.ttf",                               # macOS
]


def _load_font(candidates, size):
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    # Nothing found anywhere - warn loudly instead of silently going tiny
    print(
        f"[dsc_sign_route] WARNING: no TTF font found in {candidates}. "
        "Falling back to PIL's default bitmap font - text will render "
        "small and uniform. Place DejaVuSans-Bold.ttf and DejaVuSans.ttf "
        "next to this script to fix."
    )
    return ImageFont.load_default()

_signer_cache = None

# Box in PDF points (x1, y1, x2, y2). Wide box like Adobe's default appearance.
_DEFAULT_BOX = (400, 10, 570, 140)

# Render the composite appearance at higher pixel density for crispness,
# then let pyHanko scale it down into the PDF box.
_RENDER_SCALE = 4  # px per pt


_DN_SHORT_NAMES = {
    'country_name': 'c',
    'state_or_province_name': 'st',
    'locality_name': 'l',
    'organization_name': 'o',
    'organizational_unit_name': 'ou',
    'common_name': 'cn',
    'street_address': 'street',
    'postal_code': 'postalCode',
    'serial_number': 'serialNumber',
    'title': 'title',
    'pseudonym': 'pseudonym',
    'domain_component': 'dc',
    'email_address': 'emailAddress',
}


def _format_subject_dn(cert):
    parts = []
    for rdn in cert.subject.chosen:
        for type_and_value in rdn:
            oid = type_and_value['type']
            label = _DN_SHORT_NAMES.get(oid.native, oid.dotted)
            parts.append(f"{label}={type_and_value['value'].native}")
    # Joined into one flowing string ("c=IN, st=Maharashtra, ...") rather than
    # a list - the reference appearance packs several short fields onto the
    # same line (fill-wrapped like normal prose), it does not put every field
    # on its own line.
    return ", ".join(parts)


def _get_box(form):
    try:
        return (
            float(form['box_x1']),
            float(form['box_y1']),
            float(form['box_x2']),
            float(form['box_y2']),
        )
    except (KeyError, TypeError, ValueError):
        return _DEFAULT_BOX


def _get_signer():
    global _signer_cache
    if _signer_cache is not None:
        return _signer_cache

    if not os.path.exists(DSC_P12_PATH):
        raise FileNotFoundError(
            f"DSC certificate not found at {DSC_P12_PATH}. "
            "Set DSC_P12_PATH in .env or place the .p12 file at this location."
        )

    loaded = signers.SimpleSigner.load_pkcs12(
        pfx_file=DSC_P12_PATH,
        passphrase=DSC_CERT_PASSWORD.encode() if DSC_CERT_PASSWORD else None,
    )
    if loaded is None:
        raise ValueError(
            "Could not load the DSC certificate - DSC_CERT_PASSWORD in .env "
            "is likely wrong for this .p12 file (or the file is corrupt)."
        )
    _signer_cache = loaded
    return _signer_cache


def _wrap_lines(lines, col_wrap):
    wrapped = []
    for line in lines:
        wrapped.extend(textwrap.wrap(line, width=col_wrap) or [line])
    return wrapped


def _wrap_by_pixel_width(text_str, font, draw, max_width_px):
    """
    Word-wraps using the font's ACTUAL measured width instead of an assumed
    average-char-width. The char-count estimate elsewhere in this file wraps
    inconsistently as box size changes (e.g. "DS JK INDIA EAGRITECH" landing
    on one line in production vs. "DS JK INDIA" / "EAGRITECH" in testing,
    for the exact same certificate) because the estimate is only approximate.
    This is exact, so the break points stay the same regardless of box size.
    """
    words = text_str.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or draw.textlength(candidate, font=font) <= max_width_px:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text_str]


def _fit_font_to_lines(lines, font_candidates, box_w_px, box_h_px,
                        max_size, min_size, line_spacing, char_width_ratio=0.55):
    """
    Shrinks the font size (from max_size down to min_size) until every line
    in `lines`, word-wrapped to the available column width at that size, fits
    within box_h_px. Without this, a long DN (this cert's is ~600 chars) just
    silently renders past the bottom of the signature box and gets clipped -
    that was the actual bug, not a wrapping/formatting issue.
    Returns (font, size, col_wrap_chars, line_height_px, wrapped_lines).
    """
    for size in range(int(max_size), int(min_size) - 1, -1):
        font = _load_font(font_candidates, size)
        col_wrap = max(10, int(box_w_px / (size * char_width_ratio)))
        wrapped = _wrap_lines(lines, col_wrap)
        line_h = max(1, int(size * line_spacing))
        if len(wrapped) * line_h <= box_h_px:
            return font, size, col_wrap, line_h, wrapped

    # Nothing fit even at min_size - use it anyway rather than looping forever;
    # this only happens if the box is absurdly small for any readable text.
    size = int(min_size)
    font = _load_font(font_candidates, size)
    col_wrap = max(10, int(box_w_px / (size * char_width_ratio)))
    wrapped = _wrap_lines(lines, col_wrap)
    line_h = max(1, int(size * line_spacing))
    return font, size, col_wrap, line_h, wrapped


def _build_adobe_style_appearance(cn, dn_lines, date_str, box_pt):
    """
    Composes one PNG that looks like Adobe's default digital-signature
    appearance: large CN on the left, small DN/date block on the right,
    with the signature scrawl overlaid semi-transparently across both.
    Returns a PIL Image (RGBA) sized to match box_pt's aspect ratio.
    """
    x1, y1, x2, y2 = box_pt
    box_w_pt = x2 - x1
    box_h_pt = y2 - y1

    w = int(box_w_pt * _RENDER_SCALE)
    h = int(box_h_pt * _RENDER_SCALE)

    img = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    big_font = _load_font(_FONT_BOLD_CANDIDATES, int(h * 0.13))

    def _font_px_size(font, fallback):
        return getattr(font, "size", fallback)

    big_font_size = _font_px_size(big_font, int(h * 0.13))

    # --- Left: big wrapped CN text ---
    # Wrap width is tied to the FONT SIZE (not the box's width/height ratio),
    # using the font's real measured width via _wrap_by_pixel_width. The old
    # char-count estimate scaled with box aspect ratio, so the exact same
    # certificate wrapped as "DS JK INDIA" / "EAGRITECH" / "LIMITED 1" in one
    # box and "DS JK INDIA EAGRITECH" / "LIMITED 1" in another - inconsistent
    # purely because of box proportions, not anything about the text itself.
    left_margin = int(w * 0.012)
    cn_wrap_target_px = min(big_font_size * 9.5, w * 0.9)
    wrapped_lines = _wrap_by_pixel_width(cn, big_font, draw, cn_wrap_target_px)
    line_h = int(big_font_size * 1.15)
    actual_text_w = max(
        (draw.textlength(line, font=big_font) for line in wrapped_lines),
        default=0,
    )
    # No upper cap here: the wrap point was chosen using an estimated average
    # char width, but bold uppercase glyphs render wider than that estimate,
    # so the real text can end up wider than provisional_col_w. Capping at
    # provisional_col_w silently discarded the gap padding below and let text
    # overlap the DN column - trust the actual measured width instead.
    left_col_w = int(left_margin + actual_text_w + w * 0.015)

    y = int(h * 0.05)
    for line in wrapped_lines:
        draw.text((left_margin, y), line, font=big_font, fill=(15, 15, 15, 255))
        y += line_h

    # --- Right: small DN/date block ---
    # Font size auto-shrinks to whatever this specific DN's length actually
    # needs to fit the box - a fixed size clips (or wastes) space depending
    # on how long the certificate's DN happens to be.
    right_x = left_col_w + int(w * 0.01)
    y2_cursor_start = int(h * 0.04)
    available_h = h - y2_cursor_start
    available_w = w - right_x

    # Three flowing logical lines (each may itself wrap across several
    # physical lines) - not one physical line per DN field. `dn_lines` here
    # is the single ", "-joined DN string from _format_subject_dn.
    header_lines = [f"Digitally signed by {cn}", f"DN: {dn_lines}", f"Date: {date_str}"]
    small_font, small_font_size, col_wrap, small_line_h, wrapped = _fit_font_to_lines(
        header_lines,
        _FONT_REGULAR_CANDIDATES,
        box_w_px=available_w,
        box_h_px=available_h,
        max_size=max(6, int(h * 0.08)),
        min_size=6,
        line_spacing=1.25,
    )

    y2_cursor = y2_cursor_start
    for sub in wrapped:
        draw.text((right_x, y2_cursor), sub, font=small_font, fill=(25, 25, 25, 255))
        y2_cursor += small_line_h

    # Return the PIL Image object itself - PdfImage() expects an Image
    # (it reads .width/.height directly), not raw PNG bytes.
    return img


@app.route(API_URL + '/sign-customized-sale-bill-dsc', methods=['POST'])
def sign_customized_sale_bill_dsc():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided under field "pdf"'}), 400

    pdf_bytes = request.files['pdf'].read()
    if not pdf_bytes:
        return jsonify({'error': 'Empty PDF file'}), 400

    try:
        signer = _get_signer()
    except Exception as e:
        return jsonify({'error': f'DSC not available on server: {str(e)}'}), 500

    try:
        writer = IncrementalPdfFileWriter(io.BytesIO(pdf_bytes))

        box = _get_box(request.form)
        fields.append_signature_field(
            writer,
            SigFieldSpec(sig_field_name='DSCSignature', box=box),
        )

        # Force the widget annotation's own border off. This is separate
        # from the stamp appearance border (already 0 via border_width=0
        # below) - PDF viewers draw a default rectangle around form-field
        # widgets unless /Border and /MK are explicitly cleared.
        acro_fields = writer.root['/AcroForm']['/Fields']
        sig_annot = acro_fields[-1].get_object()
        sig_annot[NameObject('/Border')] = ArrayObject(
            [NumberObject(0), NumberObject(0), NumberObject(0)]
        )
        if NameObject('/MK') in sig_annot:
            del sig_annot[NameObject('/MK')]
        if NameObject('/BS') in sig_annot:
            bs = sig_annot[NameObject('/BS')].get_object()
            bs[NameObject('/W')] = NumberObject(0)

        signature_meta = signers.PdfSignatureMetadata(
            field_name='DSCSignature',
            reason='Sale Bill Authorization',
            location='India',
        )

        cn = signer.signing_cert.subject.native.get('common_name') or 'Authorised Signatory'
        dn_lines = _format_subject_dn(signer.signing_cert)
        # Always IST regardless of the server's own timezone - datetime.now()
        # used the server's local time, which is wrong if the server isn't
        # itself set to IST (e.g. a UTC-configured host).
        date_str = datetime.now(_IST).strftime('%Y-%m-%d %H:%M:%S') + ' IST'

        appearance_img = _build_adobe_style_appearance(cn, dn_lines, date_str, box)
        background = PdfImage(appearance_img)

        # stamp_text left blank - our composed PNG already contains ALL the
        # visible text (CN + DN + date), so pyHanko draws nothing extra.
        stamp_style = stamp.TextStampStyle(
            stamp_text=' ',
            text_box_style=text.TextBoxStyle(font_size=1),
            background=background,
            background_opacity=1.0,
            border_width=0,
        )

        pdf_signer = signers.PdfSigner(
            signature_meta,
            signer=signer,
            stamp_style=stamp_style,
        )

        out_buf = io.BytesIO()
        pdf_signer.sign_pdf(writer, output=out_buf)
        out_buf.seek(0)
    except Exception as e:
        return jsonify({'error': f'Signing failed: {str(e)}'}), 500

    return send_file(
        out_buf,
        mimetype='application/pdf',
        as_attachment=False,
        download_name='sale_bill_signed.pdf',
    )