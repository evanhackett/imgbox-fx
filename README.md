# ImgBox FX

Web app that applies a special effect to uploaded images, then stores them to be retrieved later.

## Build Steps

First `npm install` in the root directory of the project to install all node dependencies.

You will also need [GraphicsMagick](http://www.graphicsmagick.org/) installed on your system.

After installing all dependencies, you can now run the app.

To start the app: `npm start`

To run in watch mode (watches files for changes and automatically restarts server): `npm run watch`

To run the tests: `npm test`

## Notes on dependencies

The web framework is [express](https://expressjs.com/). I find it the best balance between minimalism, community support / available libraries, and overall speed of develoment. App frameworks like Django seemed to be overkill for a project like this. I didn't need an admin panel, user authentication, SQL ORM, etc.

Template files for HTML rendering are in the `views` directory. Static files are served out of the `public` directory.

For handling file uploads I used [multer](https://www.npmjs.com/package/multer). One nice thing about multer is it automatically names the files such that the names aren't likely to conflict with each other.

To apply the graphics effect, I used GraphicsMagick through the [gm](https://www.npmjs.com/package/gm) package. I was originally worried this would be one of the harder parts of the app, but it turned out to be one of the easiest.

The only other notable dependency is [rocket-store](https://www.npmjs.com/package/rocket-store), which is a super simple key/value database. I needed something like this once I started associating user-uploaded titles with the image files. I also wanted to keep track of the date the file was uploaded. I decided I just needed a way to link a file-name string to a JSON document. rocket-store seemed to fit the bill perfectly.

To see all dependencies, check out the [package.json](./package.json) file.

## Notes on architecture

The app is a traditional server-rendered app, not using any client-side javascript at all. A lot of my professional experience is building single-page applications with complex frontend frameworks, and I find it is often overkill, so I wanted to try something different. I don't regret this decision at all, I think it made things simpler.

There is really one main endpoint to make requests to, and that is `/images`. Sending a POST to `/images` is for uploading new images, and sending a GET to `/images` is for retrieving all images.

After uploading an image, the browser will be redirected to `/images/<id>`, where `id` will be the identifier of the transformed image. This page will display the transformed image. The id will also be the filename of the transformed image, as well as the key for that image's corresponding JSON document in rocket-store.

The uploaded image is stored in a folder called `uploads`, and the transformed image is stored in a folder called `transformed`.

It may have been possible to stream the image file to GraphicsMagick directly from the HTTP request, but I found it very easy to simply store the uploaded image first, and then call on GraphicsMagick to transform the given file. This could be an area for future research if this is causing performance problems at scale. Overall though, if performance at scale was a serious concern, I probably would have a completely different architecture in general. For example, I would probably use a queue and process images using a separate service. 

Probably the part of the app that required the most time was figuring out and handling all of the different error scenarios.

Possible errors include:

* uploading an image that is too big
* requests for files that don't exist
* requests with invalid title field
* POST requests with no image file
* files that are in an unsupported format (or a format that is technically supported by GraphicsMagick, but takes too long to process (such as PDFs with many pages, which take a long time to process even with relatively low file size)
* making sure title field is escaped to prevent XSS
* possibility of generic file IO error
* rocket-store error
* etc.

These are typical concerns, and not unique to this app at all. 


