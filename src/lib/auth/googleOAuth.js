import GoogleStrategy from "passport-google-oauth20"
import passport from "passport"
import UsersModel from "../../services/users/model.js"
import { generateJWTToken } from "./tools.js"

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/users/googleRedirect`,
  },
  async (accessToken, refreshToken, profile, passportNext) => {
    // this callback is executed when Google sends us a successfull response back (through the redirect URL)
    // here we gonna receive some informations about the user from Google (scopes --> profile, email)
    try {
      // 1. Check if the user is already in our DB
      const user = await UsersModel.findOne({ email: profile.emails[0].value })
      console.log("GOOGLE PROFILE: ", profile)

      if (user) {
        // 2. If user is there --> generate an accessToken for him/her, then next (to the route handler --> /users/googleRedirect)

        const accessToken = await generateJWTToken({ _id: user._id, role: user.role })

        passportNext(null, { token: accessToken })
      } else {
        // 3. If user is NOT there --> add user to DB, then create accessToken, then next (to the route handler --> /users/googleRedirect)

        const newUser = new UsersModel({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          googleId: profile.id,
        })

        const savedUser = await newUser.save()

        const accessToken = await generateJWTToken({ _id: savedUser._id, role: savedUser.role })

        console.log("ACCESS TOKEN: ", accessToken)

        passportNext(null, { token: accessToken }) // this token will be available in the request handler by using req.user.token
      }
    } catch (error) {
      passportNext(error)
    }
  }
)

// If you get the "Failed to serialize user into session" error, you have to add the following code

passport.serializeUser((data, passportNext) => {
  passportNext(null, data)
})

export default googleStrategy
