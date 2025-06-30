window.STARTPAGE_CONFIG = {
  // Set a custom wallpaper image URL or path. Leave blank for default.
  wallpaper: " ",

  // UI color settings
  colors: {
    // For containers and widgets
    primary: "rgba(0, 0, 0, 0.4)",

    // For text, borders, time, and labels
    secondary: "rgba(255, 255, 255, 1)",
  },

  // Search engine settings
  searchEngines: {
    available: {
      google:      "https://www.google.com/search?q={query}",
      bing:        "https://www.bing.com/search?q={query}",
      yahoo:       "https://search.yahoo.com/search?p={query}",
      brave:       "https://search.brave.com/search?q={query}",
      duckduckgo:  "https://duckduckgo.com/?q={query}",
      startpage:   "https://www.startpage.com/do/dsearch?query={query}",
      qwant:       "https://www.qwant.com/?q={query}",
      ecosia:      "https://www.ecosia.org/search?q={query}",
    },

    // Set your preferred search engine here
    engine: "google"
  },

  // Enable or disable fun features
  fun: {
    tetris: true, // Enable Tetris widget
    null: true    // Enable Null widget
  },

  // Bookmark columns and their items
  bookmarks: [
    {
      column: "1", // First column
      items: [
        // Each bookmark: name, URL, and custom color
        { name: "steam", url: "https://steamcommunity.com/profiles/76561199767988119", color: "#147CAF" },
        { name: "steamhunters", url: "https://steamhunters.com/id/shauv/games", color: "#7BB6FF" },
        { name: "steamdb", url: "https://steamdb.info/sales/?displayOnly=Game&min_discount=50&min_rating=90&min_reviews=2000&os=macos&sort=rating_desc", color: "#FFF" },
        { name: "steamgifts", url: "https://www.steamgifts.com/", color: "#929AA8" },
        { name: "pagywosg", url: "https://pagywosg.xyz/events", color: "#3D758B" }
      ]
    },
    {
      column: "2", // Second column
      items: [
        { name: "youtube", url: "https://www.youtube.com/feed/subscriptions", color: "#CD201F" },
        { name: "reddit", url: "https://www.reddit.com/", color: "#FF4500" },
        { name: "myanimelist", url: "https://myanimelist.net/profile/shauv", color: "#2C51A2" },
        { name: "animekai", url: "https://animekai.to/", color: "#65A45A" },
        { name: "osu", url: "https://osu.ppy.sh/users/36078384", color: "#E15A97" }
      ]
    },
    {
      column: "3", // Third column
      items: [
        { name: "office", url: "https://www.office.com/", color: "#EB3B00" },
        { name: "copilot", url: "https://copilot.microsoft.com/", color: "#2699C5" },
        { name: "monkeytype", url: "https://monkeytype.com/", color: "#F3B801" },
        { name: "vanguard", url: "https://www.vanguardinvestor.co.uk/", color: "#96151D" },
        { name: "translate", url: "https://translate.google.com/", color: "#4E8DF3" }
      ]
    }
  ]
};