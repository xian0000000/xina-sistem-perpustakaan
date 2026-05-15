package com.perpus.user.dto;

import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String email;
    private String role;
}