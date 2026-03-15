package com.nightsafe.backend.controller;

import com.nightsafe.backend.model.Contact;
import com.nightsafe.backend.model.User;
import com.nightsafe.backend.repository.ContactRepository;
import com.nightsafe.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = "*")
public class ContactController {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/{username}")
    public ResponseEntity<?> addContact(@PathVariable String username, @RequestBody Contact contact) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        contact.setUser(user);
        contactRepository.save(contact);
        return ResponseEntity.ok("Contact added successfully");
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> getContacts(@PathVariable String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        List<Contact> contacts = contactRepository.findByUser(user);
        return ResponseEntity.ok(contacts);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Contact>> getContactsByUserId(@PathVariable Long userId) {
        System.out.println("Backend: Fetching contacts for userId: " + userId);
        List<Contact> contacts = contactRepository.findByUserId(userId);
        System.out.println("Backend: Found " + contacts.size() + " contacts");
        return ResponseEntity.ok(contacts);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContact(@PathVariable Long id) {
        if (!contactRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        contactRepository.deleteById(id);
        return ResponseEntity.ok("Contact deleted");
    }
}
