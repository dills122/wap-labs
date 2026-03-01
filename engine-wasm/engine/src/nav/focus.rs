pub fn move_focus_up(current: usize, total: usize) -> usize {
    if total == 0 {
        return 0;
    }
    (current + total - 1) % total
}

pub fn move_focus_down(current: usize, total: usize) -> usize {
    if total == 0 {
        return 0;
    }
    (current + 1) % total
}

pub fn clamp_focus(current: usize, total: usize) -> usize {
    if total == 0 {
        return 0;
    }
    current.min(total - 1)
}

#[cfg(test)]
mod tests {
    use super::{clamp_focus, move_focus_down, move_focus_up};

    #[test]
    fn wraps_focus() {
        assert_eq!(move_focus_up(0, 3), 2);
        assert_eq!(move_focus_down(2, 3), 0);
        assert_eq!(clamp_focus(9, 3), 2);
        assert_eq!(clamp_focus(2, 0), 0);
        assert_eq!(move_focus_up(0, 0), 0);
        assert_eq!(move_focus_down(0, 0), 0);
    }
}
