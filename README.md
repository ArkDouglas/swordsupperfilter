# Sword and Supper - Boss Database

A comprehensive, interactive database of boss instances from the Sword and Supper game, organized by difficulty level and featuring advanced search, filtering, and sorting capabilities.

## 🌟 Features

- **Interactive Database**: Browse, search, and filter boss instances
- **Advanced Sorting**: Sort by level, difficulty, name, or type
- **Real-time Search**: Find bosses by name, location, or description
- **Add New Bosses**: Community-driven database with easy contribution
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Beautiful, intuitive interface with smooth animations
- **Local Storage**: Your additions are saved locally for persistence

## 🚀 Live Demo

Visit the live site: [Your GitHub Pages URL]

## 📱 Screenshots

### Desktop View
- Modern card-based layout
- Advanced filtering options
- Real-time search functionality
- Statistics dashboard

### Mobile View
- Responsive design
- Touch-friendly interface
- Optimized for small screens

## 🛠️ Setup Instructions

### For Users
1. Visit the live GitHub Pages site
2. Browse existing bosses or use search/filter
3. Click "Add New Boss" to contribute
4. Fill in the form and submit

### For Developers

#### Prerequisites
- Node.js 18+ (for local development)
- Git

#### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/swordandsupper.git
   cd swordandsupper
   ```

2. Serve locally:
   ```bash
   # Using Python (if installed)
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   
   # Or using PHP
   php -S localhost:8000
   ```

3. Open your browser to `http://localhost:8000`

#### GitHub Pages Deployment
The site automatically deploys to GitHub Pages when you push to the main branch.

1. Enable GitHub Pages in your repository settings
2. Set source to "GitHub Actions"
3. Push changes to trigger deployment

## 📊 Data Structure

The boss data is stored in `data.json` with the following structure:

```json
{
  "bosses": [
    {
      "id": 1,
      "name": "Boss Name",
      "level": "6-20",
      "difficulty": 3,
      "type": "boss",
      "location": "Mossy Forest",
      "description": "Boss description",
      "redditLink": "https://reddit.com/...",
      "dateAdded": "2024-01-15"
    }
  ]
}
```

### Field Descriptions
- **id**: Unique identifier
- **name**: Boss name/title
- **level**: Level range (1-5, 6-20, etc.)
- **difficulty**: 1-5 star rating
- **type**: "boss" or "boss-rush"
- **location**: Game location (optional)
- **description**: Additional details (optional)
- **redditLink**: Link to Reddit post (optional)
- **dateAdded**: Date when added to database

## 🎮 Difficulty Levels

- ⭐ **Easy** - Beginner-friendly encounters
- ⭐ ⭐ **Fair** - Moderate challenge
- ⭐ ⭐ ⭐ **Moderate** - Balanced difficulty
- ⭐ ⭐ ⭐ ⭐ **Hard** - Challenging encounters
- ⭐ ⭐ ⭐ ⭐ ⭐ **Extreme** - Maximum difficulty

## 🏃‍♂️ Boss Rush Events

Boss Rush events are special encounters marked with 🏃💨 and typically feature:
- Multiple boss encounters in sequence
- Increased difficulty
- Special rewards
- Unique mechanics

## 🤝 Contributing

### Adding New Bosses
1. Click the "Add New Boss" button
2. Fill in the required information:
   - Boss Name (required)
   - Level Range (required)
   - Difficulty (required)
   - Type (required)
3. Optionally add location, description, and Reddit link
4. Submit the form

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Include browser version and steps to reproduce

### Suggesting Improvements
- Open a GitHub Issue with your suggestions
- Fork the repository and submit a pull request

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Semantic markup and accessibility
- **CSS3**: Modern styling with Flexbox and Grid
- **Vanilla JavaScript**: No frameworks, pure JS for performance
- **Font Awesome**: Icons and visual elements
- **GitHub Pages**: Free hosting and deployment

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Performance
- Lightweight (under 100KB total)
- Fast loading times
- Optimized for mobile devices
- Local storage for offline functionality

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Sword and Supper community for boss discoveries
- Reddit community for sharing encounters
- Contributors who help maintain the database

## 📞 Support

- **GitHub Issues**: For bugs and feature requests
- **Reddit**: [r/SwordAndSupperGame](https://www.reddit.com/r/SwordAndSupperGame/)
- **Email**: [Your contact email]

---

**Built with ❤️ for the Sword and Supper community**

*Last updated: January 2024*
