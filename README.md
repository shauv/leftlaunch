<div align="center">

# LeftLaunch

***An ergonomic startpage to quickly launch your bookmarks.***

</div>

![Screenshot of LeftLaunch startpage](assets/screenshot.jpeg)

## Demo
**Live Demo:** https://shauv.github.io/leftlaunch

## Features
- **Quick Launch:** Instantly launch bookmarks with a single keypress.
- **Bookmark Filtering:** Filter matching text using the navbar (tab to focus).
- **Keyboard Navigation:** All elements are interactable using only left-hand keys.
- **Configuration:** Configure the bookmarks, wallpaper, styling, and keymaps.

*Bookmark launch priority: exact match > prefix match > substring match > bookmark order.*

## Usage
1. Fork or download this repository.
2. Edit `config.js` to configure the bookmarks, wallpaper and styling.
3. Open `index.html` in your browser.
4. Set `index.html` as your home page using the `file:///` path.

*To use as a start page instead, an extension workaround would be required for most browsers.*

## Configuration
- **Bookmarks:** Add your bookmarks into the provided rows.
- **Wallpaper:** Set a custom wallpaper by providing an image URL.
- **Styling:** Personalize your startpage with different colors, fonts and other properties.
- **Keymaps:** Choose from a selected preset of keymaps.

*All configuration options are found in `config.js`.*

### Bookmarks
The `bookmarks` are grouped into `row` `x`. Each bookmark requires a `name` and `url`:  

```javascript
bookmarks: [
    {
        row: "1",
        items: [
            // Bookmark example
            { name: "YouTube", url: "https://youtube.com" }
        ]
    },
]
```
> **Caution:** Ensure the number of bookmarks remains the same (5 in each row, totalling 15 bookmarks).

### Wallpaper
Set a custom wallpaper by providing an image `URL` or a local `path` in the `wallpaper` property:

```javascript
wallpaper: "https://w.wallhaven.cc/full/rd/wallhaven-rd989q.jpg",
```
> **Tip:** You can leave the `wallpaper` value empty to use the default.

### Styling
The `containers` and `text` property values can be adjusted. The `color` property requires a `HEX` or `rgb` value: 
```javascript
// Default color value for containers
color: "rgba(0, 0, 0, 0.4)",
```
> **Tip:** You can also use `rgba` to specify an alpha value for `opacity`.  
*Example: `rgba(r, g, b, 0.4)` for 0.4 opacity.*

*Other styling properties include the text's `size` and `fontFamily`, the containers' `borderRadius`, and the keymap's `lowercase`/`uppercase`. These should be simple enough to understand.*

### Keymaps
There are 5 keymap `preset` values to choose from: `QWERTY`, `QWERTZ`, `AZERTY`, `Colemak`, `Dvorak` and an additional `Custom` value. If `preset` is set to `Custom`, the keys specified in `customKeys` are used:
```javascript
keymap: {
    // Custom keymap example
    preset: "Custom",
    customKeys: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"],
},
```