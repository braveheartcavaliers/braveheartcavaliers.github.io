# Updating your website

You can update the website from your phone or computer. Open **app.pagescms.org** and sign in with the email invitation you received. Changes appear on the website **1 to 2 minutes after you save**. Refresh the website to see them.

## Add a new puppy

1. Open **Puppies** and tap **Add**.
2. Fill in:
   - **Name**
   - **Status:** Available
   - **Birth date:** the age on the website updates by itself
   - **Price in USD:** the full price, including the $1,000 deposit
   - **Sex** and **Color**
   - **Photos:** up to 6. The first photo is shown on the card.
   - **Short note** (optional), for example "Loves cuddles, great with kids"
3. Tap **Save**.

## When a puppy is reserved

Open the puppy, change **Status** to **Reserved**, and save. The card shows "Reserved" and the Apply button turns off.

## When a puppy goes home

Change **Status** to **Went home** and save. The puppy leaves the "Available puppies" list and moves into the **Recently went home** row, which shows new families that your puppies find loving homes.

To remove a puppy completely, delete it from the list instead.

## Add photos to the Gallery

The Gallery opens only when someone taps **Gallery** in the menu, so it never crowds the main page.

1. Open **Gallery** and tap **Add**.
2. Choose or upload a photo, and add a short caption if you like.
3. Tap **Save**. Drag photos to change their order, or delete one to remove it.

## Photo tips

- Bright daylight, puppy at eye level, plain background.
- Landscape (sideways) photos fit the cards best.
- **iPhone:** use JPG photos. If a photo will not show, go to **Settings → Camera → Formats** and choose **Most Compatible**.
- Large photos are fine. The website shrinks them automatically.

## Add a review

Open **Reviews**, tap **Add**, and fill in the name as it should appear (for example "Anna B."), the month and year, and the review text. Only add reviews the family is happy for you to share.

## Change any text or the main photo

Open **Website text** in the menu. Each item is one section of the website, in the order they appear on the page:

1. Top of page (heading, introduction, main photo, highlights bar)
2. Available puppies (the section's heading, notes, and the photo shown when no puppies are listed)
3. Meet the breeder (your two photos, about text, quick facts, show dogs and their wins)
4. Health (tests, what every puppy goes home with, the socialization photo)
5. How it works (the steps)
6. Reviews (the section's heading)
7. Contact (phone numbers and email)
8. Application (thank-you message and the confirmation email applicants receive)
9. Application questions
10. Gallery (the heading at the top of the gallery)
11. Footer

Change the text, tap **Save**, and the website updates in 1 to 2 minutes. To start a new paragraph in a longer text, leave an empty line.

## Change the application questions

Open **Website text → 9. Application questions**. Each section is one step of the form.

- **Edit a question:** change its text and save.
- **Add a question:** open a section, tap **Add** under Questions, type the question, and choose the **Answer type**. For "Choose one" questions, add each choice under **Choices**. Leave **Question ID** empty; it is filled in for you.
- **Remove a question:** delete it from the list.
- **Show a question only after a certain answer:** fill in **Only show when**, for example `ownRent = Rent` or `childCount > 0`. Use the other question's ID (shown at the bottom of each question).
- Do not change the ID of existing questions. Other questions and the Google Sheet use it.

New questions appear in the emails and get their own column in the Google Sheet automatically.

## Where applications go

When someone applies:

- you get an email at **braveheartcavaliers@gmail.com** with all their answers. Just press Reply to answer them.
- they get a confirmation email with a copy of their answers, saying we will get back to them **within 48 hours**. You can change this wording in **8. Application**.
- the application is added to the **Brave Heart Applications** Google Sheet. Use the **Status** column to track each family (New, Contacted, Approved, Declined).

## If GitHub says the website is running out of space

Photos you upload are kept in the website's history, even after you delete them. After a few years this can add up. GitHub may then email the Brave Heart account. Nothing stops working; you just clear the old history once:

1. Sign in to github.com as **braveheartcavaliers** and open the website's repository.
2. In Pages CMS, first delete any photos you no longer want (for example, puppies that went home long ago).
3. On GitHub, open the **Actions** tab and choose **Free up space** on the left.
4. Click **Run workflow**. Change **What to do** to **Free up space**, type **FREE UP SPACE** in the box, and click **Run workflow** again.
5. Wait about a minute until the run shows a green check mark.

Your website, puppies, reviews, photos and text stay exactly the same. The tool checks that every file is identical before changing anything, saves a backup first, and stops by itself if anything looks wrong. GitHub can take a few days to show the smaller size.

To test it without changing anything, leave **What to do** on **Check only**.

## Something looks wrong?

Wait 2 minutes and refresh. If it is still wrong, message Sviatlana.
