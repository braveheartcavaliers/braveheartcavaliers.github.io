# Brave Heart website: one-time setup

This takes about 30 minutes. Do every step while signed in to the **Brave Heart** accounts (braveheartcavaliers@gmail.com), so the website, the emails and the application sheet all belong to the business.

When you are done:

- the website is live at `https://YOUR-USERNAME.github.io`
- Laura adds and removes puppies in Pages CMS, with no code
- every application emails Laura, sends the applicant a confirmation, and is saved in a Google Sheet

---

## Step 1. Create the repository on GitHub

1. Sign in to github.com with the Brave Heart account.
2. Click **+** (top right) → **New repository**.
3. **Repository name:** `YOUR-USERNAME.github.io`, using your exact GitHub username. For example, if the username is `braveheartcavaliers`, the name is `braveheartcavaliers.github.io`. This gives the site the clean address `https://braveheartcavaliers.github.io`.
4. Choose **Public**. Free GitHub Pages hosting needs a public repository. Applications are never stored here; they go to Google.
5. Click **Create repository**.

## Step 2. Upload the website files

1. Unzip `brave-heart-website.zip` on your computer.
2. On the new repository page, click **uploading an existing file**.
3. Open the unzipped folder, select **everything inside it**, and drag it into the browser window.
   - **Mac:** two items start with a dot (`.pages.yml` and the `.github` folder) and are hidden in Finder. Press **Cmd + Shift + .** (period) to show them before you select everything.
4. Click **Commit changes**.
5. Check that the repository now shows `.pages.yml`, `.github`, `index.html`, `data`, `images`, `scripts` and `apps-script`.
   If `.pages.yml` or `.github` is missing, add it by hand: **Add file → Create new file**, type the exact name (for example `.github/workflows/deploy.yml`), paste the contents from the unzipped file, and commit.

## Step 3. Turn on the website

1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Go to the **Actions** tab, click **Publish website** on the left, then **Run workflow**.
4. After about 2 minutes, the site is live at `https://YOUR-USERNAME.github.io`.

From now on the site republishes by itself every time something changes, including Laura's edits in Pages CMS. It also shrinks photos automatically so the site stays fast.

## Step 4. Connect Pages CMS and invite Laura

1. Go to app.pagescms.org and sign in with the Brave Heart GitHub account.
2. When asked, install the Pages CMS GitHub app and give it access to the `YOUR-USERNAME.github.io` repository.
3. Open the repository in Pages CMS. You should see **Puppies**, **Reviews** and **Website settings** in the sidebar.
4. Find **Collaborators** and invite Laura by email. She does not need a GitHub account.
5. Give her `GUIDE-FOR-LAURA.md` (or read it together the first time).

## Step 5. Turn on application emails (Google)

### 5a. Create the sheet and paste the script
1. Signed in to Google as **braveheartcavaliers@gmail.com**, open sheets.new to create a new Google Sheet.
2. Name it **Brave Heart Applications**.
3. Click **Extensions → Apps Script**.
4. Delete the sample code, then paste in the entire contents of `apps-script/Code.gs`.
5. Click the project name at the top and rename it **Brave Heart applications**. Click **Save** (the disk icon).

### 5b. Send yourself a test (this also grants permissions)
1. In the function dropdown at the top, choose **sendTestEmails** and click **Run**.
2. Google asks for permission. Click **Review permissions** and choose the Brave Heart account.
3. You will see "Google hasn't verified this app". This is normal for a private script you wrote yourself. Click **Advanced → Go to Brave Heart applications (unsafe) → Allow**.
4. Check the Brave Heart inbox for **two emails**: the breeder notification and the applicant confirmation. The sheet now has an **Applications** tab with one test row. You can delete the test row.

### 5c. Publish the script as a web app
1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. "Anyone" lets the website send applications; it does not let anyone see the sheet.
4. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.

### 5d. Connect it to the website
1. In Pages CMS, open **Website settings**.
2. Paste the URL into **Application email service address** and save.
3. Wait about 2 minutes, then submit a test application on the live site using your own email address. You should get the confirmation, and the Brave Heart inbox should get the full application.

If the address is empty or the service is unreachable, the website still works: applicants see a "copy your application and email it to us" step instead.

## Optional extras

- **Your own domain** (for example braveheartcavaliers.com, about $12 a year): buy it from any domain seller, then follow GitHub's guide under **Settings → Pages → Custom domain**.
- **Gmail label:** in Gmail, create a filter for subject "New puppy application" that applies a label, so applications are easy to find.
- **Sheet status column:** Laura can change the **Status** column from "New" to "Contacted", "Approved" or "Declined" to track each family.

## Good to know

- Google allows about 100 automated emails a day from a free Gmail account. Each application uses two.
- If you ever change `Code.gs`, publish it with **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same web app address.
- The puppy list, reviews and photos are public files in the repository. Applications, with people's addresses and phone numbers, only ever go to Google.
