# Lady & Delilah Card Maker

A local browser app for making dark post-apocalyptic fantasy trading cards. It uses plain HTML, CSS, and JavaScript. There is no backend, login, paid service, or build step.

## How to Run

Open this file in a browser:

Open `trading-cards/index.html` from the repository root.

The app runs directly from the file.

## Phone Preview

To preview on a phone, the phone and computer need to be on the same network.

1. Right-click `start-phone-preview.ps1`.
2. Choose `Run with PowerShell`.
3. On the phone, open:

   `http://192.168.1.67:8787/`

If your computer's local IP address changes, run `ipconfig` in PowerShell and use the IPv4 address shown for your active Wi-Fi or Ethernet adapter.

## Version 2.0 Features

- Tabbed workspace: Front, Back, Library, Pack Builder, Settings
- Front and Back preview tabs
- Larger artwork window while preserving the 2.5 x 3.5 card ratio
- Drag-to-position artwork
- Zoom slider from 0.5x to 3x with centered 1.0x normal scale
- Fit Image and Fill Frame buttons
- Mouse wheel artwork zoom
- Double-click artwork reset
- Finish styles: Standard, Foil, Holographic, Relic, Dark Matte
- Finish intensity slider
- Premium Holo Border with separate intensity and sparkle controls
- Live text updates
- Auto-scaling title, quote, and lore text
- Quote limit: 90 characters with a live counter
- Lore limit: 160 characters with a live counter
- Front-card font size controls for Title, Card Type, Quote, Lore, and Footer
- Advanced Layout controls for final artwork width and height offsets
- Card Type dropdown with Custom manual entry
- Expanded rarity set: None, Common, Uncommon, Rare, Epic, Legendary, Promo, Foil
- Card Number field displayed in the footer and card type strip
- Template selector: Default, Character, Weapon, Location, Creature, Artifact
- Duplicate Card button
- Save Project and Load Project using local JSON files
- Single-card PNG export
- 9-card PNG sheet export
- Single-card PDF export
- 9-card 8.5 x 11 PDF export
- PDF-only print options for margins, cut guides, and bleed
- Export profiles for Screen Preview, Home Print, Bright Print, and Maximum Recovery
- Print calibration sheet export with four profile samples on one PDF page
- Pack Builder for loading saved PNG cards and generating printable random packs
- Card Library for saving finished cards in the current project and exporting sheets

## Save / Load

`Save Project` downloads a JSON file containing the card text, type, rarity, card number, template, finish style, finish intensity, holo border settings, print options, image, zoom, fit/fill mode, and image position.

`Load Project` restores that JSON file later. Image data is embedded in the JSON, so project files can be larger when high-resolution artwork is used.

## Print Sizing

The working card canvas is 750 x 1050 pixels, which is a true 2.5 x 3.5 ratio.

PDF exports use print points:

- One card: 180 x 252 points, exactly 2.5 x 3.5 inches
- 9-card sheet: 612 x 792 points, exactly 8.5 x 11 inches

The 9-card sheet places nine exact-size cards on one letter page. Cut guides can be toggled for PDF exports.

Export profiles affect exports only. `Screen Preview` applies no correction. `Home Print`, `Bright Print`, and `Maximum Recovery` progressively boost brightness, shadow recovery, contrast, saturation, and gamma so dark cards are less likely to print muddy while preserving very dark borders and line art.

`Export Calibration Sheet` creates one 8.5 x 11 PDF page with the current card repeated four times: Screen Preview, Home Print, Bright Print, and Maximum Recovery. Print it once to compare which profile works best on your printer.

## Pack Builder

Use the `Pack Builder` panel at the bottom of the app.

1. Click `Choose Card PNGs` and select exported card images.
2. Set `Number of Cards`.
3. Check `Allow Duplicates` if repeats are allowed.
4. Check `Balanced Pack Mode` to use filename rarity tags when available.
5. Click `Generate Pack`.
6. Export the pack as ZIP, PDF print sheets, or CSV.

Rarity tags are read from filenames like:

- `C-001-Delilah_common.png`
- `C-002-Lady_rare.png`
- `W-001-Intimacy-Blade_legendary.png`

Balanced 10-card packs try to include 6 common cards, 3 uncommon/rare cards, and 1 epic/legendary/promo card. If tags are missing or there are not enough tagged cards, the app fills the rest from the loaded pool.

## Card Library

Use the `Card Library` panel to build printable sheets from cards made in the editor.

1. Finish a front card in the editor.
2. Click `Add Current Card to Library`.
3. Repeat for each card you want on a sheet.
4. Click a library thumbnail to load that saved card back into the editor.
5. Use `Remove` to delete a card from the library.
6. Export the library as a 9-card PDF or PNG sheet.

Project saves include the Card Library entries, editable snapshots, visual settings, print settings, screen thumbnails, and print-ready card images. Library sheet exports use each saved card's own print-ready image, so changing the current export profile later will not change cards already added to the library.

## Files

- `index.html` - app layout and controls
- `styles.css` - interface styling
- `app.js` - card rendering, image movement, project save/load, and exports
- `start-phone-preview.ps1` - optional local web server for phone preview
