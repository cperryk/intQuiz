<h1>SimpleQuiz</h1>

_The quiz file_

*Quiz*
- title: String. The title of the quiz. This will appear on the top bar of the quiz, on the title slide (if it is included), in the headline of the Facebook share request, and in the Twitter share request.
- description: String. A short description of the quiz. This will appear below the title of the quiz on the title slide (if it is included). This will also be the description in the Facebook share request unless fb_description is set.
- title_slide. Boolean. If true, a title slide with the title and description will be the first to appear instead of the first question. Default is false.
- share_name: String. What the quiz should be called in the share dialogs. Will default to *"[title] quiz"*
- fb_description: String. Text that appears as the description in a Facebook share request. Defaults to description.
- thumbnail: String. A URL to a thumbnail that will appear in the Facebook share request.
- questions: Array. An array of question objects.
- choices: Array. An array of choice objects. Set the choice objects here instead of in each question if the questions all share the same choices.
- blocked_choices: Boolean. Setting to true shrinks the width of all choice elements, allowing two to appear in the same row. Good for short choices.
- exclusionary_choices: Boolean. Setting to true makes each question's answer disable the corresponding choice in subsequent chances. Only works when the .choices variable is set so that choices are consistent across questions.
- attribution:
- teaser

*Question*
- content: String. Text representing the question. May contain HTML.
- choices: Array. An array of choice objects.
- correct: String, integer, or array. The ID of the correct choice, if choices are set at the top level, or an array of IDs.
- feedback. Object. Describes the contents of the feedback. The feedback is what appears when the user answers a question. See feedback below.

*Choice*
- content: String. Text representign the choice. May contain HTML.
- validity: Boolean. Set to "true" if the choice is correct. Default is "false." Multiple choices may be marked as correct.
- id: String or integer. Used when choices are set at the top level so that questions can connect with them.

*Feedback*
- content: String. The HTML to show on feedback.
- img: Object or string. If string, the SRC of the image. If object, see "Feedback Img" below.

*Feedback Img*
- src: String. The name of the image. The program will look inside the quiz directory for the image.
- credit: String. A credit for the image. This will appear in a semi-transparent overlay in the lower right-hand corner of the image.
- position: String, "bottom" or "top." If "bottom," the image will appear below the choice content. If "top," the image will appear above the choice content. Defaults to bottom.
