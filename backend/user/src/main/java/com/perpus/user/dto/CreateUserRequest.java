package com.perpus.user.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private Long id;
    private String name;
    private String email;
    private String role;
}