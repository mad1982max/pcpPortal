{
  const authUrl = "https://pcp-portal.ga/auth.php";
  // https://pcp-portal.ga/login.php
  // https://pcp-portal.ga/auth.php

  let success = null; // local variable for auth status
  const resolveCallbacks = [];
  const rejectCallbacks = [];
  const commonCallbacks = [];

  const loginData = {
    admin: {
      password: "bixit",
      token: "3050cfad-2354-4cfe-8e86-40b9de3ddecb",
    },
    Dolwinalpha: {
      password: "LLrttqG2",
      token: "e11ff623-14f5-4951-bb8c-2cf7c9c3621e",
    },
  };
  Object.freeze(loginData);
  Object.values(loginData).forEach(function (o) {
    Object.freeze(o);
  });
  Object.defineProperty(window, "loginData", { value: loginData });

  Object.defineProperty(window, "auth_status_object", {
    value: Object.defineProperties(
      {},
      {
        succesfuly_logged_in: {
          // auth status accessor
          value: function () {
            return success;
          },
        },
        add_auth_callbacks: {
          value: function (callbackObj) {
            let { resolve, reject } = callbackObj;
            if (typeof resolve !== "function") resolve = null;
            if (typeof reject !== "function") reject = null;
            // save
            if (resolve) resolveCallbacks.push(resolve); // puch in case it's exists
            if (reject) rejectCallbacks.push(reject);
            if (success !== null) {
              // call
              const callback = success ? resolve : reject;
              if (callback) callback();
            }
          },
        },
        add_auth_callback: {
          value: function (callback) {
            if (typeof callback !== "function") return;
            // save
            commonCallbacks.push(callback);
            if (success !== null) {
              callback(success);
            }
          },
        },
        auth_check: {
          value: function () {
            const token = window.localStorage.getItem("token");

            /*const xhr = new XMLHttpRequest();
                    xhr.open('POST', authUrl, true);
                    xhr.responseType = 'json';

                    const formData = new FormData();
                    formData.append('token', token);
                    xhr.send(formData);

                    xhr.onload = function () {
                        success = (xhr.status === 200);
                        (success ? resolveCallbacks : rejectCallbacks).forEach(function (callback) { callback(); });
                        commonCallbacks.forEach(function (callback) { callback(success); });
                    }*/
            success = Object.values(loginData).some(function (value) {
              if (value.token === token) return true;
            });
            (success ? resolveCallbacks : rejectCallbacks).forEach(function (
              callback
            ) {
              callback();
            });
            commonCallbacks.forEach(function (callback) {
              callback(success);
            });
          },
        },
      }
    ),
  });
  auth_status_object.auth_check();
}
