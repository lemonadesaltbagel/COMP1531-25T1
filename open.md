## Open ended features

This file is used to document any open-ended features that were implemented.

***

### Part A (Thinking Bigger with LLMs)

#### Feature 1: INSERT_FEATURE_NAME_HERE
Route: INSERT_ROUTE_HERE

METHOD: INSERT_METHOD_HERE

Description: WHAT_DOES_IT_DO (might wanna talk about its significance to the project if there is any)

Technical Complexity: WHAT_WAS_HARD_ABOUT_IMPLEMETING_THIS. (might also wanna talk about how you overcome it)

Other highlights: IF_ANY

#### Feature 2: INSERT_FEATURE_NAME_HERE (If you have multiple features implemented)
Route: INSERT_ROUTE_HERE

METHOD: INSERT_METHOD_HERE

Description: WHAT_DOES_IT_DO (might wanna talk about its significance to the project if there is any)

Technical Complexity: WHAT_WAS_HARD_ABOUT_IMPLEMETING_THIS. (might also wanna talk about how you overcome it)

Other highlights: IF_ANY

***

### Part B (Thinking Bigger with Files or Multi-user elements)
#### Feature 1: File Attachments

Route (PUT, DELETE): /v1/admin/quiz/{quizid}/question/{questionid}/upload
Route (GET): /v1/uploads/{filename}

Description: This route allows quiz creators to attach files to their quiz questions, and view them.

Technical Complexity: Uploading files, not something particularly within the scope of the course so finding readily available information was
an obstacle. Overcame this through scraping the internet for a variety of different techniques on how to upload files to express servers, and came 
across the multer package. At this stage, only the file would be uploaded to the server, and its path stored in the question data structure.
Didn't stop there, wanted to raise the level of technical complexity by adding additional routes: removing unwanted files, and additionally opening owned files.
Also deleting files from server was something that was unfamiliar, but upon researching I came across the fs.unlink() function.

I ensured to maintain user security, not allowing other users to access and delete another user's files, etc.

Other highlights: Opens up a new world for Tahook, adding new systems for engagement and learning. Really awesome to be able to see my local files on my computer, uploaded into my uploads/ directory in project-backend! Felt really rewarding seeing this feature come to fruition.

#### Feature 2: INSERT_FEATURE_NAME_HERE (If you have multiple features implemented)
Route: /v1/admin/quiz/{quizid}/export
METHOD: GET

Route: /v1/admin/quiz/import
METHOD: POST

Description: Allows a user to export their own quizzes, and allows users to import theirs and other users' quizzes.

Technical Complexity: Prompting file downloads after export not something I've worked on before. Similar to the last route, researching a number of different ways to prompt user downloads... I came across
the content disposition: attachment headers, which instructs the browser to treat the server response as a file to be downloaded rather than rendered inline
when we call res.statusCode(200).send(result).

Other highlights: This is a revolutionary feature for Tahook, as forms the foundations for a variety of new features, in particular a marketplace system for quizzes. In addition to this, a number of User stories encapsulates multiple teachers within a school making the same quiz but for different classes. This ability to share quizzes removes this redundancy, and allows teachers to be more efficient in their processes. Sooooo... instead of 3 teachers individually creating these quizzes, we can now have 1 teacher creating this same quiz to share, whilst the other 2 teachers work on developing other classroom content.
