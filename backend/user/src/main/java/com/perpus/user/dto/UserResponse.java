package com.perpus.user.dto;

import com.perpus.user.model.User;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private String address;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setName(user.getName());
        res.setEmail(user.getEmail());
        res.setRole(user.getRole());
        res.setPhone(user.getPhone());
        res.setAddress(user.getAddress());
        res.setCreatedAt(user.getCreatedAt());
        return res;
    }
}
