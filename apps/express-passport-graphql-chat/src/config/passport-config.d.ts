export interface IJwtPayload {
  iss: string; // issuer
  // in our case, we use 'thechatapp' as the issuer

  aud: string; // audience
  // in our case, we use 'thechatapp' as the audience

  sub: string; // subject (opaque identifier or public identifier for the user)
  // in our case, we use userId (email) as the subject

  jti: string; // JWT ID (unique identifier for the token to prevent replay attacks)
  // this is a random unique identifier for the token, it should be unique per token

  sid: string; // session ID (to identify the session across multiple tokens)
  // so, if there is a token refresh in the same session, the jti will change but the sid will remain the same
  
  ver: number; // token version
  // increment this if the token structure changes in a non-backward-compatible way
  // this allows to reject tokens with an old version if needed

  iat: number; // issued at
  // iat is in seconds since epoch
  // used for global user invalidation:
  // ===================================
  // if user changes password, we can invalidate all tokens issued before the password change
  // by storing the password change timestamp in the user record and comparing it with iat
  // Reject token if token.iat < user.lastPasswordChange (or compare numeric version instead).
  // Effect: all tokens issued before a security event (password reset, 2FA enable, account lock) die instantly without tracking each token.
  // Session revocation cutoff:
  // ===================================
  // this makes easier to implement session revocation if desired in the future
  // by storing the session revocation timestamp in the user record and comparing it with iat
  // Reject token if token.iat < user.sessionRevocationTimestamp
  // Effect: all tokens issued before a session revocation event die instantly without tracking each token
  // Note: this is different from sid which is per session, this is global for the user

  exp: number; // expiration
  // exp is in seconds since epoch
  // exp is when the token expires so it is used to determine if the token is expired
  // Note: this is different from iat which is issued at.
}
