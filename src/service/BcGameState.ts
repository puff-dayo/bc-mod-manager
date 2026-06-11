/**
 * Helpers for interpreting Bondage Club's global runtime state.
 *
 * BC creates a blank Player during GameStart while still on Character/Login;
 * the real logged-in player is only available after LoginResponse marks the
 * server session as logged in and fills Player.CharacterID.
 */
export class BcGameState {
  static hasPlayer(): boolean {
    return typeof Player !== 'undefined' && !!Player;
  }

  static isLoginScreen(): boolean {
    return typeof CurrentModule === 'undefined'
      || typeof CurrentScreen === 'undefined'
      || (CurrentModule === 'Character' && CurrentScreen === 'Login');
  }

  static isPreferenceScreen(): boolean {
    return typeof CurrentModule !== 'undefined'
      && typeof CurrentScreen !== 'undefined'
      && CurrentModule === 'Character'
      && CurrentScreen === 'Preference';
  }

  static isLoggedIn(): boolean {
    const serverLoggedIn = typeof ServerIsLoggedIn === 'function' && ServerIsLoggedIn();
    if (serverLoggedIn) return true;

    return typeof Player !== 'undefined'
      && !!Player
      && typeof Player.CharacterID === 'string'
      && Player.CharacterID !== '';
  }

  static canLoadMods(): boolean {
    return this.hasPlayer();
  }
}
