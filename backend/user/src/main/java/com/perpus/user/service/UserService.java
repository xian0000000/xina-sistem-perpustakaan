package com.perpus.user.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.perpus.user.dto.AdminUpdateUserRequest;
import com.perpus.user.dto.CreateUserRequest;
import com.perpus.user.dto.UpdateProfileRequest;
import com.perpus.user.dto.UserResponse;
import com.perpus.user.model.User;
import com.perpus.user.repository.UserRepository;
@Service
public class UserService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${auth.service.url}")
    private String authServiceUrl;

    public UserService(UserRepository userRepository, RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
    }

    public UserResponse createUser(CreateUserRequest req) {
        if (userRepository.existsById(req.getId())) {
            return UserResponse.from(userRepository.findById(req.getId()).get());
        }
        User user = new User();
        user.setId(req.getId());
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setRole(req.getRole() != null ? req.getRole() : "member");
        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.from(user);
    }

    public UserResponse updateMyProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getName() != null) {
            user.setName(req.getName());
        }
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone());
        }
        if (req.getAddress() != null) {
            user.setAddress(req.getAddress());
        }

        return UserResponse.from(userRepository.save(user));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.from(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
        restTemplate.delete(authServiceUrl + "/internal/users/" + id);
    }

    public UserResponse adminUpdateUser(Long id, AdminUpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getEmail() != null) {
            user.setEmail(req.getEmail());
        }
        if (req.getRole() != null) {
            user.setRole(req.getRole());
        }

        userRepository.save(user);
        syncToAuthService(id, user.getEmail(), user.getRole());
        return UserResponse.from(user);
    }

    private void syncToAuthService(Long id, String email, String role) {
        Map<String, String> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("role", role);
        restTemplate.put(authServiceUrl + "/internal/users/" + id, payload);
    }
}
