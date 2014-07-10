<h1>SimpleQuiz</h1>

<h2>QUIZ JSON</h2>
<h3>Quiz</h3>
Top-level properties. Mandatory properties in red.
- <span style="color:red">**title**</span>: String. The title of the quiz. This will appear on the top bar of the quiz, on the title slide (if it is included), in the headline of the Facebook share request, and in the Twitter share request.
- <span style="color:red">**description**</span>: String. A short description of the quiz. This will appear below the title of the quiz on the title slide (if it is included). This will also be the description in the Facebook share request unless fb_description is set.
- **title_slide**: Boolean. If true, a title slide with the title and description will be the first to appear instead of the first question. Default is false.
- **share_name**: String. What the quiz should be called in the share dialogs. Will default to *"[title] quiz"*
- **fb_description**: String. Text that appears as the description in a Facebook share request. Defaults to description.
- **thumbnail**: String. A URL to a thumbnail that will appear in the Facebook share request. If none is provided, the program will look for a promo image on the Slate. If none is found, IntSharing defaults to a Slate logo.
- <span style="color:red">**questions**</span>: Array. An array of question objects. See *Question* below.
- **choices**: Array or dictionary. If an array, an array of choice objects. Set the choice objects here instead of in each question if the questions all share the same choices. If an object, a dictionary of rounds, with each key being a round ID and each value being an array of choices. Rounds are useful if you multiple groups of the questions, and choices are consistent inside each group but not between groups.
- **blocked_choices**: Boolean. Setting to true shrinks the width of all choice elements, allowing two to appear in the same row. Good for short choices.
- **exclusionary_choices**: Boolean. Setting to true makes each question's answer disable the corresponding choice in subsequent questions. Only works when the top-level .choices variable is set so that choices are consistent across questions.
- **attribution**: String. Adds text to the attribution. Useful if you must give image credits to images that appear in the choices containers.
- **teaser**: String. A blurb that appears at the end to tease to another article.
- **matcher**: Object. If this is set, this is a Matching Quiz, in which the user answers questions that matches him or her to one of a predetermined set of results. This object contains information specific to the matchmaking logic of the quiz. See *Matcher* below.
- **auto_advance**: Boolean. If true, the quiz will automatically advance to the next question after the user answers. Default is false.
- **collapse_questions**: Boolean. If true, the quiz will automatically collapse the question container after the user has answered a question. Useful so the quiz container doens't get too tall with the addition of the feedback container.
- **collapse_choices**: Boolean. If true, the quiz will automatically collapse the choices container after ther user has answered a question. Useful so the quiz container doesn't get too tall with the addition of the feedback container.

<h3>Question</h3>
- **content**: String. Text representing the question. May contain HTML.
- **img**: String. The filename of the image to appear with this question, above the question content.
- **choices**: Array or string. If an array, an array of choice objects. If a string, the ID of the choice round, as set inside the top level "choices" variable. If blank, the program will assume the top-level "choices" variable is an array of choices and use that. See *Choice*.
- **correct**: String, integer, or array. The ID or IDs of the correct choice(s), if choices are set at the top level, or an array of IDs.
- **feedback**. Object. Describes the contents of the feedback. The feedback is what appears when the user answers a question. See feedback below.
- **sound**: String. The ID of a sound to go with the choice. Sounds must be stored in a "sounds" directory within the quiz directory.

<h3>Choice</h3>
A choice can be an object or a string. If the choice is a string, it is assumed to be purely textual, with a false validity.
- **content**: String. Text representign the choice. May contain HTML.
- **validity**: Boolean. Set to "true" if the choice is correct. Default is "false." Multiple choices may be marked as correct.
- **sound**: String. The ID a sound to go with the choice. Sounds must be stored in a "sounds" directory within the quiz directory.
- **id**: String or integer. Used when choices are set at the top level so that questions can connect with them.

<hr/>
<h3>Feedback</h3>
- **content**: String. The HTML to show on feedback.
- **img**: Object or string. If string, the SRC of the image. If object, see "Feedback Img" below.
- **sound**: In progress.

<h4>Feedback Img</h4>
- **src**: String. The name of the image. The program will look inside the quiz directory for the image.
- **credit**: String. A credit for the image. This will appear in a semi-transparent overlay in the lower right-hand corner of the image.
- **position**: String, "bottom" or "top." If "bottom," the image will appear below the choice content. If "top," the image will appear above the choice content. Defaults to bottom.

<hr/>
<h3>Matcher</h3>
- **results**: Object. A dictionary of results objects. See **Matcher Result** below.
- **end_text**: String. This is the text that appears before the result text. For example, "Your city is..." or "Your song is..."

<h3>Matcher Result</h3>
- **content**: String. The title of the result. For example, a song title or city name.
- **descriptor**: String. A description of the result and/or why the user received it. Appears below the result content.
- **youtube**: String. The ID of a YouTube video related to the result. If set, a video will appear above the result content. A YouTube video's ID can be found at the end of its URL.
- **share_text**: String. What will appear in the share dialogs for this result.

<h1>To-do</h1>
- When a sound button is pressed, and the user advances to the next slide before the sound loads, the sound plays, with no way to stop it but playing a different sound
- For fill in the blank questions, make it so that if the interactive is below or above the user's scroll, letters that are entered are not typed. This is to prevent people from accidentally responding to a question by typing a comment, for example.
