# MAN Blog

**A manly blogging platform built with:**
- Markdown
- Angular
- Node

## Gulp Commands

```gulp serve```
Serve the site in development

```gulp new-post```
Guided prompts to generate a skeleton new blog post.

### Setting default prompt values
You can save default values for the new-post generator function in a file called 'man.json' in the root directory of the project.

#### Supported Values:
- **defaultPostsDirectory:**
Path where you want to store blog posts.
- **defaultAuthor:**
The default author to use.

##### Example man.json file

````
{
	"defaultPostsDirectory": "/path/to/posts",
	"defaultAuthor": "Malcolm Reynolds"
}
````
