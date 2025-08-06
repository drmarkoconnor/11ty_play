export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy('src/assets')
	eleventyConfig.addPassthroughCopy('src/js')
	eleventyConfig.addPassthroughCopy('src/css')
	eleventyConfig.addPassthroughCopy('src/images')
	return {
		dir: {
			input: 'src',
			output: '_site',
			includes: '_includes',
		},
	}
}

