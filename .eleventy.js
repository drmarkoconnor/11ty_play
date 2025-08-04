module.exports = function (eleventyConfig) {
	// Passthrough copy for the 'assets' folder
	// Explicitly passthrough specific folders and file types
	eleventyConfig.addPassthroughCopy({ 'src/assets/images': 'assets/images' })
	eleventyConfig.addPassthroughCopy({ 'src/assets/css': 'assets/css' })
	eleventyConfig.addPassthroughCopy({ 'src/assets/js': 'assets/js' })
	eleventyConfig.addPassthroughCopy({ 'src/assets/fonts': 'assets/fonts' })
	// For individual file types, you can use glob patterns:
	eleventyConfig.addPassthroughCopy('src/assets/**/*.svg')
	eleventyConfig.addPassthroughCopy('src/assets/**/*.ico')
	return {
		dir: {
			input: 'src',
			output: '_site',
		},
	}
}

