<?php
// Functions for user validation and data handling
function validateUser($username, $password) {
    $users = file('ART/sandbox/php-forum/data/users.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($users as $user) {
        list($storedUsername, $storedPassword) = explode(':', $user);
        if ($storedUsername === $username && $storedPassword === md5($password)) {
            return true;
        }
    }
    return false;
}

function getUser($username) {
    $users = file('ART/sandbox/php-forum/data/users.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($users as $user) {
        list($storedUsername, $storedPassword) = explode(':', $user);
        if ($storedUsername === $username) {
            return ['username' => $storedUsername, 'password' => $storedPassword];
        }
    }
    return null;
}
?>