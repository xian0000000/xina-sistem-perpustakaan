package com.perpus.user.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perpus.user.dto.AdminUpdateUserRequest;
import com.perpus.user.dto.CreateUserRequest;
import com.perpus.user.dto.UpdateProfileRequest;
import com.perpus.user.dto.UserResponse;
import com.perpus.user.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/internal/create")
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest req) {
        return ResponseEntity.status(201).body(userService.createUser(req));
    }

    // GET /users/me — semua user yang login
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return ResponseEntity.ok(userService.getMyProfile(userId));
    }

    // PUT /users/me — update profil sendiri
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(
            HttpServletRequest request,
            @RequestBody UpdateProfileRequest req) {
        Long userId = (Long) request.getAttribute("userId");
        return ResponseEntity.ok(userService.updateMyProfile(userId, req));
    }

    // GET /users — admin & librarian only
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET /users/{id} — admin & librarian only
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // DELETE /users/{id} — admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> adminUpdateUser(
            @PathVariable Long id,
            @RequestBody AdminUpdateUserRequest req) {
        return ResponseEntity.ok(userService.adminUpdateUser(id, req));
    }
}
