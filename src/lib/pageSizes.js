// Page sizes in PDF points (1pt = 1/72 inch).
//
// Letter and Legal are US sizes nobody hands in here, and picking one by
// mistake is invisible until the print comes out wrong. The list is the ISO
// sizes Korea actually uses. Its own module because two tools need it and a
// copy in each is a copy that can drift.
export const PAGE_SIZES = {
  A4: [595.28, 841.89], // 210 x 297 mm
  A5: [419.53, 595.28], // 148 x 210 mm
  B5: [498.9, 708.66], // 176 x 250 mm
}
